import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRateLimit } from '@/lib/api/validate';

export async function GET(request: NextRequest) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const rateLimited = withRateLimit(user.id, 'products:analytics', 30);
  if (rateLimited) return rateLimited;

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setMonth(defaultStart.getMonth() - 1);
  const start = startDate || defaultStart.toISOString().split('T')[0];
  const end = endDate || today.toISOString().split('T')[0];

  const [salesResult, productsResult] = await Promise.all([
    (supabase as any)
      .from('sales_records')
      .select('product_id, channel, quantity, total_revenue, net_profit, platform_fee, payment_fee, status')
      .eq('user_id', user.id)
      .gte('sale_date', start)
      .lte('sale_date', end),
    (supabase as any)
      .from('products')
      .select('id, name, sku, base_cost')
      .eq('user_id', user.id),
  ]);

  const sales: any[] = salesResult.data || [];
  const products: any[] = productsResult.data || [];

  const productMap: Record<string, {
    id: string;
    name: string;
    sku: string | null;
    baseCost: number;
    revenue: number;
    profit: number;
    quantity: number;
    salesCount: number;
    platformFees: number;
    returnCount: number;
    channels: Set<string>;
  }> = {};

  for (const p of products) {
    productMap[p.id] = {
      id: p.id,
      name: p.name,
      sku: p.sku,
      baseCost: p.base_cost,
      revenue: 0,
      profit: 0,
      quantity: 0,
      salesCount: 0,
      platformFees: 0,
      returnCount: 0,
      channels: new Set(),
    };
  }

  for (const s of sales) {
    if (!productMap[s.product_id]) continue;
    const p = productMap[s.product_id];

    if (s.status === 'returned' || s.status === 'cancelled') {
      p.returnCount += s.quantity;
      continue;
    }

    p.revenue += s.total_revenue;
    p.profit += s.net_profit;
    p.quantity += s.quantity;
    p.salesCount++;
    p.platformFees += (s.platform_fee || 0) + (s.payment_fee || 0);
    p.channels.add(s.channel);
  }

  const totalRevenue = Object.values(productMap).reduce((s, p) => s + p.revenue, 0);

  const analytics = Object.values(productMap)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      baseCost: p.baseCost,
      revenue: p.revenue,
      profit: p.profit,
      quantity: p.quantity,
      salesCount: p.salesCount,
      platformFees: p.platformFees,
      returnCount: p.returnCount,
      marginRate: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      avgPrice: p.quantity > 0 ? p.revenue / p.quantity : 0,
      revenueShare: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
      channels: Array.from(p.channels),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ABC 분석
  let cumRevenue = 0;
  const abcAnalysis = analytics.map((p) => {
    cumRevenue += p.revenue;
    const cumShare = totalRevenue > 0 ? (cumRevenue / totalRevenue) * 100 : 0;
    let grade: 'A' | 'B' | 'C';
    if (cumShare <= 70) grade = 'A';
    else if (cumShare <= 90) grade = 'B';
    else grade = 'C';
    return { ...p, abcGrade: grade, cumulativeShare: cumShare };
  });

  return NextResponse.json({
    period: { startDate: start, endDate: end },
    totalRevenue,
    totalProfit: Object.values(productMap).reduce((s, p) => s + p.profit, 0),
    totalQuantity: Object.values(productMap).reduce((s, p) => s + p.quantity, 0),
    products: abcAnalysis,
  });
}
