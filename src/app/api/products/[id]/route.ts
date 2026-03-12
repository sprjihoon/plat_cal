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

  const { data, error } = await supabase
    .from('products')
    .select('*, product_markets(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
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
    const { name, sku, base_cost, image_url, markets } = body;

    // 상품 업데이트
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (base_cost !== undefined) updateData.base_cost = base_cost;
    if (image_url !== undefined) updateData.image_url = image_url;

    const { data: product, error: productError } = await (supabase as any)
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
      }
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    // 마켓 설정 업데이트 (기존 삭제 후 재생성)
    if (markets && Array.isArray(markets)) {
      await (supabase as any)
        .from('product_markets')
        .delete()
        .eq('product_id', id);

      if (markets.length > 0) {
        const marketInserts = markets.map((market: any) => ({
          product_id: id,
          channel: market.channel,
          sub_option_id: market.sub_option_id || null,
          selling_price: market.selling_price || 0,
          platform_fee_rate: market.platform_fee_rate || 0,
          payment_fee_rate: market.payment_fee_rate || 0,
          additional_costs: market.additional_costs || {},
          is_active: market.is_active !== false,
        }));

        await (supabase as any).from('product_markets').insert(marketInserts);
      }
    }

    // 업데이트된 상품과 마켓 정보 함께 반환
    const { data: fullProduct } = await supabase
      .from('products')
      .select('*, product_markets(*)')
      .eq('id', id)
      .single();

    return NextResponse.json(fullProduct);
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

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
