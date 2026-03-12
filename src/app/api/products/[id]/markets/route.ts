import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateMargin } from '@/lib/calculator';
import type { CalculatorInputs } from '@/types';

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

  // 상품 정보 가져오기
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*, product_markets(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (productError) {
    if (productError.code === 'PGRST116') {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // 각 마켓별 수익 계산
  const productData = product as any;
  const marketsWithProfit = (productData.product_markets || []).map((market: any) => {
    const additionalCosts = market.additional_costs || {};
    
    const inputs: CalculatorInputs = {
      sellingPrice: market.selling_price,
      productCost: productData.base_cost,
      discountRate: 0,
      discountAmount: 0,
      platformFeeRate: market.platform_fee_rate,
      paymentFeeRate: market.payment_fee_rate,
      couponBurden: 0,
      sellerShippingCost: additionalCosts.shipping_cost || 0,
      customerShippingCost: 0,
      packagingCost: additionalCosts.packaging_cost || 0,
      materialCost: 0,
      advertisingCost: additionalCosts.advertising_cost || 0,
      otherCosts: additionalCosts.other_costs || 0,
      sellingPriceVatIncluded: true,
      wholesaleVatType: 'excluded',
      targetMarginRate: 30,
    };

    try {
      const result = calculateMargin(inputs);
      return {
        ...market,
        calculation: {
          netProfit: result.netProfit,
          marginRate: result.marginRate,
          totalDeductions: result.totalDeductions,
          platformFee: result.platformFee,
          paymentFee: result.paymentFee,
          netVat: result.netVat,
        },
      };
    } catch (error) {
      return {
        ...market,
        calculation: null,
        error: '계산 오류',
      };
    }
  });

  return NextResponse.json({
    product: {
      id: productData.id,
      name: productData.name,
      sku: productData.sku,
      base_cost: productData.base_cost,
      image_url: productData.image_url,
    },
    markets: marketsWithProfit,
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 상품 소유권 확인
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { channel, sub_option_id, selling_price, platform_fee_rate, payment_fee_rate, additional_costs, is_active } = body;

    if (!channel) {
      return NextResponse.json({ error: '채널은 필수입니다' }, { status: 400 });
    }

    const { data: market, error: marketError } = await (supabase as any)
      .from('product_markets')
      .insert({
        product_id: id,
        channel,
        sub_option_id: sub_option_id || null,
        selling_price: selling_price || 0,
        platform_fee_rate: platform_fee_rate || 0,
        payment_fee_rate: payment_fee_rate || 0,
        additional_costs: additional_costs || {},
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (marketError) {
      if (marketError.code === '23505') {
        return NextResponse.json({ error: '이미 등록된 마켓입니다' }, { status: 409 });
      }
      return NextResponse.json({ error: marketError.message }, { status: 500 });
    }

    return NextResponse.json(market, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
