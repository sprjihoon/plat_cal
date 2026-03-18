import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const groupBy = searchParams.get('groupBy') || 'day';

  if (!startDate || !endDate) {
    return NextResponse.json({ error: '기간을 선택하세요' }, { status: 400 });
  }

  const [salesResult, adResult, opResult] = await Promise.all([
    (supabase as any)
      .from('sales_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: true }),
    (supabase as any)
      .from('advertising_costs')
      .select('*')
      .eq('user_id', user.id)
      .gte('ad_date', startDate)
      .lte('ad_date', endDate)
      .order('ad_date', { ascending: true }),
    (supabase as any)
      .from('operating_expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: true }),
  ]);

  if (salesResult.error) {
    return NextResponse.json({ error: salesResult.error.message }, { status: 500 });
  }
  if (adResult.error) {
    return NextResponse.json({ error: adResult.error.message }, { status: 500 });
  }
  if (opResult.error) {
    return NextResponse.json({ error: opResult.error.message }, { status: 500 });
  }

  const sales = salesResult.data || [];
  const advertising = adResult.data || [];
  const operating = opResult.data || [];

  const getGroupKey = (dateStr: string) => {
    const date = new Date(dateStr);
    if (groupBy === 'day') return dateStr;
    if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart.toISOString().split('T')[0];
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const groupData = (data: any[], dateField: string) => {
    const grouped: Record<string, any[]> = {};
    data.forEach((item) => {
      const key = getGroupKey(item[dateField]);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  };

  const groupedSales = groupData(sales, 'sale_date');
  const groupedAds = groupData(advertising, 'ad_date');
  const groupedOps = groupData(operating, 'expense_date');

  const allKeys = new Set([
    ...Object.keys(groupedSales),
    ...Object.keys(groupedAds),
    ...Object.keys(groupedOps),
  ]);
  const sortedKeys = Array.from(allKeys).sort();

  const periodSummaries = sortedKeys.map((key) => {
    const pSales = groupedSales[key] || [];
    const pAds = groupedAds[key] || [];
    const pOps = groupedOps[key] || [];

    const revenue = pSales.reduce((s: number, r: any) => s + r.total_revenue, 0);
    const productCost = pSales.reduce((s: number, r: any) => s + (r.unit_price * r.quantity - r.total_revenue + r.net_profit), 0);
    const profit = pSales.reduce((s: number, r: any) => s + r.net_profit, 0);
    const quantity = pSales.reduce((s: number, r: any) => s + r.quantity, 0);
    const platformFee = pSales.reduce((s: number, r: any) => s + (r.platform_fee || 0), 0);
    const paymentFee = pSales.reduce((s: number, r: any) => s + (r.payment_fee || 0), 0);
    const adCost = pAds.reduce((s: number, a: any) => s + a.cost, 0);
    const operatingCost = pOps.reduce((s: number, o: any) => s + o.amount, 0);
    const impressions = pAds.reduce((s: number, a: any) => s + a.impressions, 0);
    const clicks = pAds.reduce((s: number, a: any) => s + a.clicks, 0);
    const conversions = pAds.reduce((s: number, a: any) => s + a.conversions, 0);

    const totalCost = adCost + operatingCost;
    const netProfitAfterAll = profit - adCost - operatingCost;
    const roas = adCost > 0 ? (revenue / adCost) * 100 : 0;
    const roi = totalCost > 0 ? ((profit - totalCost) / totalCost) * 100 : 0;

    const pSalesVat = revenue / 11;
    const pPurchaseVat = pSales.reduce((s: number, r: any) => {
      return s + (r.platform_fee || 0) / 11 + (r.payment_fee || 0) / 11;
    }, 0);
    const pVatPayable = pSalesVat - pPurchaseVat;

    return {
      period: key,
      revenue,
      profit,
      quantity,
      salesCount: pSales.length,
      platformFee,
      paymentFee,
      adCost,
      operatingCost,
      totalCost,
      impressions,
      clicks,
      conversions,
      netProfitAfterAd: profit - adCost,
      netProfitAfterAll,
      roas,
      roi,
      salesVat: pSalesVat,
      purchaseVat: pPurchaseVat,
      vatPayable: pVatPayable,
    };
  });

  const sum = (arr: typeof periodSummaries, key: keyof typeof periodSummaries[0]) =>
    arr.reduce((s, p) => s + (p[key] as number), 0);

  const totalRevenue = sum(periodSummaries, 'revenue');
  const totalProfit = sum(periodSummaries, 'profit');
  const totalAdCost = sum(periodSummaries, 'adCost');
  const totalOperatingCost = sum(periodSummaries, 'operatingCost');
  const totalAllCost = totalAdCost + totalOperatingCost;

  const totalSalesVat = sum(periodSummaries, 'salesVat');
  const totalPurchaseVat = sum(periodSummaries, 'purchaseVat');
  const totalVatPayable = totalSalesVat - totalPurchaseVat;

  const totalSummary = {
    revenue: totalRevenue,
    profit: totalProfit,
    quantity: sum(periodSummaries, 'quantity'),
    salesCount: sum(periodSummaries, 'salesCount'),
    platformFee: sum(periodSummaries, 'platformFee'),
    paymentFee: sum(periodSummaries, 'paymentFee'),
    adCost: totalAdCost,
    operatingCost: totalOperatingCost,
    totalCost: totalAllCost,
    impressions: sum(periodSummaries, 'impressions'),
    clicks: sum(periodSummaries, 'clicks'),
    conversions: sum(periodSummaries, 'conversions'),
    netProfitAfterAd: totalProfit - totalAdCost,
    netProfitAfterAll: totalProfit - totalAllCost,
    roas: totalAdCost > 0 ? (totalRevenue / totalAdCost) * 100 : 0,
    roi: totalAllCost > 0 ? ((totalProfit - totalAllCost) / totalAllCost) * 100 : 0,
    marginRate: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    salesVat: totalSalesVat,
    purchaseVat: totalPurchaseVat,
    vatPayable: totalVatPayable,
  };

  const channelSummary: Record<string, any> = {};
  sales.forEach((sale: any) => {
    if (!channelSummary[sale.channel]) {
      channelSummary[sale.channel] = { revenue: 0, profit: 0, quantity: 0, count: 0, adCost: 0, operatingCost: 0 };
    }
    channelSummary[sale.channel].revenue += sale.total_revenue;
    channelSummary[sale.channel].profit += sale.net_profit;
    channelSummary[sale.channel].quantity += sale.quantity;
    channelSummary[sale.channel].count += 1;
  });

  advertising.forEach((ad: any) => {
    if (!channelSummary[ad.channel]) {
      channelSummary[ad.channel] = { revenue: 0, profit: 0, quantity: 0, count: 0, adCost: 0, operatingCost: 0 };
    }
    channelSummary[ad.channel].adCost += ad.cost;
  });

  const expenseCategorySummary: Record<string, number> = {};
  operating.forEach((op: any) => {
    expenseCategorySummary[op.category] = (expenseCategorySummary[op.category] || 0) + op.amount;
  });

  return NextResponse.json({
    period: { startDate, endDate, groupBy },
    totalSummary,
    periodSummaries,
    channelSummary: Object.entries(channelSummary).map(([channel, data]) => ({
      channel,
      ...data,
    })),
    expenseCategorySummary: Object.entries(expenseCategorySummary).map(([category, amount]) => ({
      category,
      amount,
    })),
  });
}
