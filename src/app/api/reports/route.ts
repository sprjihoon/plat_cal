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
  const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

  if (!startDate || !endDate) {
    return NextResponse.json({ error: '기간을 선택하세요' }, { status: 400 });
  }

  // 판매 데이터 조회
  const { data: sales, error: salesError } = await (supabase as any)
    .from('sales_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('sale_date', startDate)
    .lte('sale_date', endDate)
    .order('sale_date', { ascending: true });

  if (salesError) {
    return NextResponse.json({ error: salesError.message }, { status: 500 });
  }

  // 광고비 데이터 조회
  const { data: advertising, error: adError } = await (supabase as any)
    .from('advertising_costs')
    .select('*')
    .eq('user_id', user.id)
    .gte('ad_date', startDate)
    .lte('ad_date', endDate)
    .order('ad_date', { ascending: true });

  if (adError) {
    return NextResponse.json({ error: adError.message }, { status: 500 });
  }

  // 기간별 그룹핑
  const groupData = (data: any[], dateField: string) => {
    const grouped: Record<string, any[]> = {};
    
    data.forEach((item) => {
      const date = new Date(item[dateField]);
      let key: string;
      
      if (groupBy === 'day') {
        key = item[dateField];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    return grouped;
  };

  const groupedSales = groupData(sales || [], 'sale_date');
  const groupedAds = groupData(advertising || [], 'ad_date');

  // 모든 기간 키 수집
  const allKeys = new Set([...Object.keys(groupedSales), ...Object.keys(groupedAds)]);
  const sortedKeys = Array.from(allKeys).sort();

  // 기간별 요약 생성
  const periodSummaries = sortedKeys.map((key) => {
    const periodSales = groupedSales[key] || [];
    const periodAds = groupedAds[key] || [];

    const revenue = periodSales.reduce((sum: number, s: any) => sum + s.total_revenue, 0);
    const profit = periodSales.reduce((sum: number, s: any) => sum + s.net_profit, 0);
    const quantity = periodSales.reduce((sum: number, s: any) => sum + s.quantity, 0);
    const adCost = periodAds.reduce((sum: number, a: any) => sum + a.cost, 0);
    const impressions = periodAds.reduce((sum: number, a: any) => sum + a.impressions, 0);
    const clicks = periodAds.reduce((sum: number, a: any) => sum + a.clicks, 0);
    const conversions = periodAds.reduce((sum: number, a: any) => sum + a.conversions, 0);

    const netProfitAfterAd = profit - adCost;
    const roas = adCost > 0 ? (revenue / adCost) * 100 : 0;
    const roi = adCost > 0 ? ((profit - adCost) / adCost) * 100 : 0;

    return {
      period: key,
      revenue,
      profit,
      quantity,
      salesCount: periodSales.length,
      adCost,
      impressions,
      clicks,
      conversions,
      netProfitAfterAd,
      roas,
      roi,
    };
  });

  // 전체 요약
  const totalSummary = {
    revenue: periodSummaries.reduce((sum, p) => sum + p.revenue, 0),
    profit: periodSummaries.reduce((sum, p) => sum + p.profit, 0),
    quantity: periodSummaries.reduce((sum, p) => sum + p.quantity, 0),
    salesCount: periodSummaries.reduce((sum, p) => sum + p.salesCount, 0),
    adCost: periodSummaries.reduce((sum, p) => sum + p.adCost, 0),
    impressions: periodSummaries.reduce((sum, p) => sum + p.impressions, 0),
    clicks: periodSummaries.reduce((sum, p) => sum + p.clicks, 0),
    conversions: periodSummaries.reduce((sum, p) => sum + p.conversions, 0),
    netProfitAfterAd: 0,
    roas: 0,
    roi: 0,
  };
  totalSummary.netProfitAfterAd = totalSummary.profit - totalSummary.adCost;
  totalSummary.roas = totalSummary.adCost > 0 ? (totalSummary.revenue / totalSummary.adCost) * 100 : 0;
  totalSummary.roi = totalSummary.adCost > 0 ? ((totalSummary.profit - totalSummary.adCost) / totalSummary.adCost) * 100 : 0;

  // 채널별 요약
  const channelSummary: Record<string, any> = {};
  (sales || []).forEach((sale: any) => {
    if (!channelSummary[sale.channel]) {
      channelSummary[sale.channel] = { revenue: 0, profit: 0, quantity: 0, count: 0 };
    }
    channelSummary[sale.channel].revenue += sale.total_revenue;
    channelSummary[sale.channel].profit += sale.net_profit;
    channelSummary[sale.channel].quantity += sale.quantity;
    channelSummary[sale.channel].count += 1;
  });

  (advertising || []).forEach((ad: any) => {
    if (!channelSummary[ad.channel]) {
      channelSummary[ad.channel] = { revenue: 0, profit: 0, quantity: 0, count: 0, adCost: 0 };
    }
    channelSummary[ad.channel].adCost = (channelSummary[ad.channel].adCost || 0) + ad.cost;
  });

  return NextResponse.json({
    period: { startDate, endDate, groupBy },
    totalSummary,
    periodSummaries,
    channelSummary: Object.entries(channelSummary).map(([channel, data]) => ({
      channel,
      ...data,
    })),
  });
}
