import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity-log';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type'); // sales, advertising, products, report
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const format = searchParams.get('format') || 'csv'; // csv or json

  let data: any[] = [];
  let filename = '';
  let headers: string[] = [];

  switch (type) {
    case 'sales': {
      let query = (supabase as any)
        .from('sales_records')
        .select('*, products(name, sku)')
        .eq('user_id', user.id)
        .order('sale_date', { ascending: false });

      if (startDate) query = query.gte('sale_date', startDate);
      if (endDate) query = query.lte('sale_date', endDate);

      const { data: sales, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      data = (sales || []).map((s: any) => ({
        날짜: s.sale_date,
        상품명: s.products?.name || '',
        SKU: s.products?.sku || '',
        채널: s.channel,
        수량: s.quantity,
        단가: s.unit_price,
        매출: s.total_revenue,
        플랫폼수수료: s.platform_fee,
        결제수수료: s.payment_fee,
        순이익: s.net_profit,
        메모: s.notes || '',
      }));
      headers = ['날짜', '상품명', 'SKU', '채널', '수량', '단가', '매출', '플랫폼수수료', '결제수수료', '순이익', '메모'];
      filename = `판매기록_${startDate || 'all'}_${endDate || 'all'}`;
      break;
    }

    case 'advertising': {
      let query = (supabase as any)
        .from('advertising_costs')
        .select('*')
        .eq('user_id', user.id)
        .order('ad_date', { ascending: false });

      if (startDate) query = query.gte('ad_date', startDate);
      if (endDate) query = query.lte('ad_date', endDate);

      const { data: ads, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      data = (ads || []).map((a: any) => ({
        날짜: a.ad_date,
        채널: a.channel,
        광고유형: a.ad_type || '',
        캠페인명: a.campaign_name || '',
        광고비: a.cost,
        노출수: a.impressions,
        클릭수: a.clicks,
        전환수: a.conversions,
        CTR: a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(2) + '%' : '0%',
        CVR: a.clicks > 0 ? ((a.conversions / a.clicks) * 100).toFixed(2) + '%' : '0%',
        CPC: a.clicks > 0 ? Math.round(a.cost / a.clicks) : 0,
        메모: a.notes || '',
      }));
      headers = ['날짜', '채널', '광고유형', '캠페인명', '광고비', '노출수', '클릭수', '전환수', 'CTR', 'CVR', 'CPC', '메모'];
      filename = `광고비_${startDate || 'all'}_${endDate || 'all'}`;
      break;
    }

    case 'products': {
      const { data: products, error } = await (supabase as any)
        .from('products')
        .select('*, product_markets(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      data = (products || []).map((p: any) => ({
        상품명: p.name,
        SKU: p.sku || '',
        원가: p.base_cost,
        등록일: p.created_at.split('T')[0],
        마켓수: p.product_markets?.length || 0,
      }));
      headers = ['상품명', 'SKU', '원가', '등록일', '마켓수'];
      filename = `상품목록_${new Date().toISOString().split('T')[0]}`;
      break;
    }

    case 'report': {
      if (!startDate || !endDate) {
        return NextResponse.json({ error: '기간을 선택하세요' }, { status: 400 });
      }

      // 판매 데이터
      const { data: sales } = await (supabase as any)
        .from('sales_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);

      // 광고비 데이터
      const { data: ads } = await (supabase as any)
        .from('advertising_costs')
        .select('*')
        .eq('user_id', user.id)
        .gte('ad_date', startDate)
        .lte('ad_date', endDate);

      const totalRevenue = (sales || []).reduce((sum: number, s: any) => sum + s.total_revenue, 0);
      const totalProfit = (sales || []).reduce((sum: number, s: any) => sum + s.net_profit, 0);
      const totalQuantity = (sales || []).reduce((sum: number, s: any) => sum + s.quantity, 0);
      const totalAdCost = (ads || []).reduce((sum: number, a: any) => sum + a.cost, 0);
      const netProfitAfterAd = totalProfit - totalAdCost;
      const roas = totalAdCost > 0 ? (totalRevenue / totalAdCost) * 100 : 0;

      data = [{
        기간: `${startDate} ~ ${endDate}`,
        총매출: totalRevenue,
        총순이익: totalProfit,
        총판매수량: totalQuantity,
        판매건수: (sales || []).length,
        총광고비: totalAdCost,
        광고후순이익: netProfitAfterAd,
        ROAS: roas.toFixed(0) + '%',
      }];
      headers = ['기간', '총매출', '총순이익', '총판매수량', '판매건수', '총광고비', '광고후순이익', 'ROAS'];
      filename = `결산리포트_${startDate}_${endDate}`;
      break;
    }

    default:
      return NextResponse.json({ error: '유효하지 않은 타입입니다' }, { status: 400 });
  }

  logActivity(supabase, user.id, 'export_data', type || 'unknown', {
    format,
    rows: data.length,
  });

  if (format === 'json') {
    return NextResponse.json(data);
  }

  // CSV 생성
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const value = row[h];
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');

  return new NextResponse(BOM + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}.csv"`,
    },
  });
}
