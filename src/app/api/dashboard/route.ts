import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateMargin } from '@/lib/calculator';
import type { CalculatorInputs } from '@/types';

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 상품 및 마켓 정보 가져오기
  const { data: products, error } = await supabase
    .from('products')
    .select('*, product_markets(*)')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 통계 계산
  const totalProducts = products?.length || 0;
  let totalMarkets = 0;
  let totalProfit = 0;
  let profitableProducts = 0;
  let unprofitableProducts = 0;
  
  const marketStats: Record<string, { count: number; totalProfit: number }> = {};
  const productProfits: { id: string; name: string; profit: number; marginRate: number }[] = [];

  (products as any[])?.forEach((product) => {
    let productTotalProfit = 0;
    let productBestMarginRate = -Infinity;

    product.product_markets?.forEach((market: any) => {
      if (!market.is_active) return;
      
      totalMarkets++;
      
      const additionalCosts = market.additional_costs || {};
      const inputs: CalculatorInputs = {
        sellingPrice: market.selling_price,
        productCost: product.base_cost,
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
        productTotalProfit += result.netProfit;
        productBestMarginRate = Math.max(productBestMarginRate, result.marginRate);
        totalProfit += result.netProfit;

        // 마켓별 통계
        if (!marketStats[market.channel]) {
          marketStats[market.channel] = { count: 0, totalProfit: 0 };
        }
        marketStats[market.channel].count++;
        marketStats[market.channel].totalProfit += result.netProfit;
      } catch {
        // 계산 오류 무시
      }
    });

    if (product.product_markets?.length > 0) {
      productProfits.push({
        id: product.id,
        name: product.name,
        profit: productTotalProfit,
        marginRate: productBestMarginRate === -Infinity ? 0 : productBestMarginRate,
      });

      if (productTotalProfit > 0) {
        profitableProducts++;
      } else {
        unprofitableProducts++;
      }
    }
  });

  // TOP 5 상품 (수익 높은/낮은)
  const sortedByProfit = [...productProfits].sort((a, b) => b.profit - a.profit);
  const topProfitProducts = sortedByProfit.slice(0, 5);
  const lowProfitProducts = sortedByProfit.slice(-5).reverse();

  // 마켓별 통계 정리
  const marketSummary = Object.entries(marketStats)
    .map(([channel, stats]) => ({
      channel,
      count: stats.count,
      totalProfit: stats.totalProfit,
      avgProfit: stats.count > 0 ? stats.totalProfit / stats.count : 0,
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit);

  return NextResponse.json({
    summary: {
      totalProducts,
      totalMarkets,
      totalProfit,
      profitableProducts,
      unprofitableProducts,
      avgProfitPerProduct: totalProducts > 0 ? totalProfit / totalProducts : 0,
    },
    topProfitProducts,
    lowProfitProducts,
    marketSummary,
  });
}
