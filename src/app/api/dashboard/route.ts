import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || 'today';
  const customStart = searchParams.get('startDate');
  const customEnd = searchParams.get('endDate');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  let startDate: string;
  let endDate: string;

  if (customStart && customEnd) {
    startDate = customStart;
    endDate = customEnd;
  } else {
    endDate = todayStr;
    switch (period) {
      case 'today':
        startDate = endDate;
        break;
      case 'week': {
        const d = new Date(today);
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().split('T')[0];
        break;
      }
      case '2weeks': {
        const d = new Date(today);
        d.setDate(d.getDate() - 14);
        startDate = d.toISOString().split('T')[0];
        break;
      }
      case 'month': {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 1);
        startDate = d.toISOString().split('T')[0];
        break;
      }
      case 'quarter': {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 3);
        startDate = d.toISOString().split('T')[0];
        break;
      }
      case 'half': {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 6);
        startDate = d.toISOString().split('T')[0];
        break;
      }
      case 'year': {
        const d = new Date(today);
        d.setFullYear(d.getFullYear() - 1);
        startDate = d.toISOString().split('T')[0];
        break;
      }
      default:
        startDate = endDate;
    }
  }

  const prevDuration = new Date(endDate).getTime() - new Date(startDate).getTime();
  const prevEndDate = new Date(new Date(startDate).getTime() - 86400000).toISOString().split('T')[0];
  const prevStartDate = new Date(new Date(startDate).getTime() - prevDuration).toISOString().split('T')[0];

  const [salesResult, adResult, opResult, prevSalesResult, prevAdResult, prevOpResult] = await Promise.all([
    (supabase as any).from('sales_records').select('*').eq('user_id', user.id)
      .gte('sale_date', startDate).lte('sale_date', endDate),
    (supabase as any).from('advertising_costs').select('*').eq('user_id', user.id)
      .gte('ad_date', startDate).lte('ad_date', endDate),
    (supabase as any).from('operating_expenses').select('*').eq('user_id', user.id)
      .gte('expense_date', startDate).lte('expense_date', endDate),
    (supabase as any).from('sales_records').select('total_revenue, net_profit, quantity').eq('user_id', user.id)
      .gte('sale_date', prevStartDate).lte('sale_date', prevEndDate),
    (supabase as any).from('advertising_costs').select('cost').eq('user_id', user.id)
      .gte('ad_date', prevStartDate).lte('ad_date', prevEndDate),
    (supabase as any).from('operating_expenses').select('amount').eq('user_id', user.id)
      .gte('expense_date', prevStartDate).lte('expense_date', prevEndDate),
  ]);

  const sales = salesResult.data || [];
  const ads = adResult.data || [];
  const ops = opResult.data || [];
  const prevSales = prevSalesResult.data || [];
  const prevAds = prevAdResult.data || [];
  const prevOps = prevOpResult.data || [];

  const revenue = sales.reduce((s: number, r: any) => s + r.total_revenue, 0);
  const profit = sales.reduce((s: number, r: any) => s + r.net_profit, 0);
  const quantity = sales.reduce((s: number, r: any) => s + r.quantity, 0);
  const adCost = ads.reduce((s: number, a: any) => s + a.cost, 0);
  const operatingCost = ops.reduce((s: number, o: any) => s + o.amount, 0);
  const totalCost = adCost + operatingCost;
  const netProfitAfterAll = profit - totalCost;
  const roas = adCost > 0 ? (revenue / adCost) * 100 : 0;
  const roi = totalCost > 0 ? ((profit - totalCost) / totalCost) * 100 : 0;
  const marginRate = revenue > 0 ? (profit / revenue) * 100 : 0;

  const prevRevenue = prevSales.reduce((s: number, r: any) => s + r.total_revenue, 0);
  const prevProfit = prevSales.reduce((s: number, r: any) => s + r.net_profit, 0);
  const prevAdCost = prevAds.reduce((s: number, a: any) => s + a.cost, 0);
  const prevOpCost = prevOps.reduce((s: number, o: any) => s + o.amount, 0);
  const prevTotalCost = prevAdCost + prevOpCost;
  const prevNetProfitAfterAll = prevProfit - prevTotalCost;

  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  const dailySales: Record<string, { revenue: number; profit: number; adCost: number; opCost: number; quantity: number }> = {};
  sales.forEach((s: any) => {
    if (!dailySales[s.sale_date]) dailySales[s.sale_date] = { revenue: 0, profit: 0, adCost: 0, opCost: 0, quantity: 0 };
    dailySales[s.sale_date].revenue += s.total_revenue;
    dailySales[s.sale_date].profit += s.net_profit;
    dailySales[s.sale_date].quantity += s.quantity;
  });
  ads.forEach((a: any) => {
    if (!dailySales[a.ad_date]) dailySales[a.ad_date] = { revenue: 0, profit: 0, adCost: 0, opCost: 0, quantity: 0 };
    dailySales[a.ad_date].adCost += a.cost;
  });
  ops.forEach((o: any) => {
    if (!dailySales[o.expense_date]) dailySales[o.expense_date] = { revenue: 0, profit: 0, adCost: 0, opCost: 0, quantity: 0 };
    dailySales[o.expense_date].opCost += o.amount;
  });

  const dailyTrend = Object.entries(dailySales)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      revenue: d.revenue,
      profit: d.profit,
      adCost: d.adCost,
      operatingCost: d.opCost,
      netProfit: d.profit - d.adCost - d.opCost,
      quantity: d.quantity,
    }));

  const channelRevenue: Record<string, number> = {};
  sales.forEach((s: any) => {
    channelRevenue[s.channel] = (channelRevenue[s.channel] || 0) + s.total_revenue;
  });

  const topProducts: Record<string, { name: string; revenue: number; profit: number; quantity: number }> = {};
  sales.forEach((s: any) => {
    if (!topProducts[s.product_id]) {
      topProducts[s.product_id] = { name: s.product_id, revenue: 0, profit: 0, quantity: 0 };
    }
    topProducts[s.product_id].revenue += s.total_revenue;
    topProducts[s.product_id].profit += s.net_profit;
    topProducts[s.product_id].quantity += s.quantity;
  });

  return NextResponse.json({
    period: { startDate, endDate, label: period },
    summary: {
      revenue,
      profit,
      quantity,
      salesCount: sales.length,
      adCost,
      operatingCost,
      totalCost,
      netProfitAfterAll,
      roas,
      roi,
      marginRate,
    },
    changes: {
      revenue: calcChange(revenue, prevRevenue),
      profit: calcChange(profit, prevProfit),
      totalCost: calcChange(totalCost, prevTotalCost),
      netProfitAfterAll: calcChange(netProfitAfterAll, prevNetProfitAfterAll),
    },
    dailyTrend,
    channelRevenue: Object.entries(channelRevenue)
      .map(([channel, rev]) => ({ channel, revenue: rev }))
      .sort((a, b) => b.revenue - a.revenue),
    topProducts: Object.values(topProducts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
  });
}
