import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await (supabase as any)
    .from('sales_records')
    .select('*, products(name, sku)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: '판매 기록을 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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

    const updateData: any = {};
    if (product_id !== undefined) updateData.product_id = product_id;
    if (product_market_id !== undefined) updateData.product_market_id = product_market_id;
    if (channel !== undefined) updateData.channel = channel;
    if (sale_date !== undefined) updateData.sale_date = sale_date;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit_price !== undefined) updateData.unit_price = unit_price;
    if (quantity !== undefined && unit_price !== undefined) {
      updateData.total_revenue = quantity * unit_price;
    }
    if (platform_fee !== undefined) updateData.platform_fee = platform_fee;
    if (payment_fee !== undefined) updateData.payment_fee = payment_fee;
    if (net_profit !== undefined) updateData.net_profit = net_profit;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await (supabase as any)
      .from('sales_records')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, products(name, sku)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '판매 기록을 찾을 수 없습니다' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await (supabase as any)
    .from('sales_records')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
