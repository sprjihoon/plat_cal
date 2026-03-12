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
  const channel = searchParams.get('channel');
  const productId = searchParams.get('productId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  
  const offset = (page - 1) * limit;

  let query = (supabase as any)
    .from('sales_records')
    .select('*, products(name, sku)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('sale_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (startDate) {
    query = query.gte('sale_date', startDate);
  }
  if (endDate) {
    query = query.lte('sale_date', endDate);
  }
  if (channel) {
    query = query.eq('channel', channel);
  }
  if (productId) {
    query = query.eq('product_id', productId);
  }

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
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      product_id,
      product_market_id,
      channel,
      sale_date,
      quantity,
      unit_price,
      platform_fee,
      payment_fee,
      net_profit,
      notes,
    } = body;

    if (!product_id || !channel || !sale_date || !quantity || !unit_price) {
      return NextResponse.json({ error: '필수 항목을 입력하세요' }, { status: 400 });
    }

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
        notes: notes || null,
      })
      .select('*, products(name, sku)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
