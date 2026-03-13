import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  
  const offset = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select('*, product_markets(*)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  if (startDate) {
    query = query.gte('created_at', `${startDate}T00:00:00`);
  }
  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    products: data,
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
    const { name, sku, base_cost, image_url, markets } = body;

    if (!name) {
      return NextResponse.json({ error: '상품명은 필수입니다' }, { status: 400 });
    }

    // 상품 생성
    const { data: product, error: productError } = await (supabase as any)
      .from('products')
      .insert({
        user_id: user.id,
        name,
        sku: sku || null,
        base_cost: base_cost || 0,
        image_url: image_url || null,
        stock_quantity: body.stock_quantity || 0,
        low_stock_threshold: body.low_stock_threshold || 10,
      })
      .select()
      .single();

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    // 마켓 설정이 있으면 함께 저장
    if (markets && Array.isArray(markets) && markets.length > 0) {
      const marketInserts = markets.map((market: any) => ({
        product_id: product.id,
        channel: market.channel,
        sub_option_id: market.sub_option_id || null,
        selling_price: market.selling_price || 0,
        platform_fee_rate: market.platform_fee_rate || 0,
        payment_fee_rate: market.payment_fee_rate || 0,
        additional_costs: market.additional_costs || {},
        is_active: market.is_active !== false,
      }));

      const { error: marketsError } = await (supabase as any)
        .from('product_markets')
        .insert(marketInserts);

      if (marketsError) {
        console.error('Markets insert error:', marketsError);
      }
    }

    // 생성된 상품과 마켓 정보 함께 반환
    const { data: fullProduct } = await supabase
      .from('products')
      .select('*, product_markets(*)')
      .eq('id', product.id)
      .single();

    return NextResponse.json(fullProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
