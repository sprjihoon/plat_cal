import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { withAuth, withRateLimit, validateBody } from '@/lib/api/validate';
import { logActivity } from '@/lib/activity-log';

const createSaleSchema = z.object({
  product_id: z.string().uuid('올바른 상품을 선택하세요'),
  product_market_id: z.string().uuid().nullable().optional(),
  channel: z.string().min(1, '채널을 선택하세요'),
  sale_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다'),
  quantity: z.number().int().min(1, '수량은 1 이상이어야 합니다'),
  unit_price: z.number().min(0, '단가는 0 이상이어야 합니다'),
  platform_fee: z.number().min(0).optional(),
  payment_fee: z.number().min(0).optional(),
  net_profit: z.number().optional(),
  status: z.enum(['completed', 'returned', 'cancelled', 'exchanged']).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const rateLimited = withRateLimit(user.id, 'sales:get', 60);
  if (rateLimited) return rateLimited;

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const channel = searchParams.get('channel');
  const productId = searchParams.get('productId');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  
  const offset = (page - 1) * limit;

  let query = (supabase as any)
    .from('sales_records')
    .select('*, products(name, sku)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('sale_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (startDate) query = query.gte('sale_date', startDate);
  if (endDate) query = query.lte('sale_date', endDate);
  if (channel) query = query.eq('channel', channel);
  if (productId) query = query.eq('product_id', productId);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    sales: data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const rateLimited = withRateLimit(user.id, 'sales:post', 20);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const validation = validateBody(body, createSaleSchema);
    if (!validation.success) return validation.response;

    const { product_id, product_market_id, channel, sale_date, quantity, unit_price, platform_fee, payment_fee, net_profit, status, notes } = validation.data;
    const total_revenue = quantity * unit_price;

    const { data, error } = await (supabase as any)
      .from('sales_records')
      .insert({
        user_id: user.id,
        product_id,
        product_market_id: product_market_id || null,
        channel,
        sale_date,
        quantity,
        unit_price,
        total_revenue,
        platform_fee: platform_fee || 0,
        payment_fee: payment_fee || 0,
        net_profit: net_profit || 0,
        status: status || 'completed',
        notes: notes || null,
      })
      .select('*, products(name, sku)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logActivity(supabase, user.id, 'create_sale', 'sales_records', {
      channel,
      quantity,
      total_revenue,
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
