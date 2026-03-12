'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react';
import { formatCurrency } from '@/lib/calculator';
import { calculateMargin } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';
import type { Product, ProductMarket } from '@/types/database';
import type { CalculatorInputs } from '@/types';

interface MarketComparisonProps {
  product: Product & { product_markets: ProductMarket[] };
}

interface MarketWithProfit extends ProductMarket {
  netProfit: number;
  marginRate: number;
}

export function MarketComparison({ product }: MarketComparisonProps) {
  const getChannelName = (channel: string) => {
    return PLATFORM_PRESETS[channel as keyof typeof PLATFORM_PRESETS]?.name || channel;
  };

  const calculateProfit = (market: ProductMarket): MarketWithProfit | null => {
    const additionalCosts = (market.additional_costs as any) || {};
    
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
      return {
        ...market,
        netProfit: result.netProfit,
        marginRate: result.marginRate,
      };
    } catch {
      return null;
    }
  };

  const marketsWithProfit = product.product_markets
    .filter((m) => m.is_active)
    .map(calculateProfit)
    .filter((m): m is MarketWithProfit => m !== null)
    .sort((a, b) => b.netProfit - a.netProfit);

  const bestMarket = marketsWithProfit[0];
  const worstMarket = marketsWithProfit[marketsWithProfit.length - 1];

  if (marketsWithProfit.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>마켓별 수익 비교</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          활성화된 마켓이 없습니다
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>마켓별 수익 비교</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 최고/최저 수익 요약 */}
        {marketsWithProfit.length > 1 && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">최고 수익</p>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-semibold">{getChannelName(bestMarket.channel)}</p>
                  <p className="text-green-600 font-bold">
                    {formatCurrency(bestMarket.netProfit)} ({bestMarket.marginRate.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">최저 수익</p>
              <div>
                <p className="font-semibold">{getChannelName(worstMarket.channel)}</p>
                <p className={`font-bold ${worstMarket.netProfit >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatCurrency(worstMarket.netProfit)} ({worstMarket.marginRate.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 전체 마켓 리스트 */}
        <div className="space-y-2">
          {marketsWithProfit.map((market, index) => {
            const isBest = index === 0 && marketsWithProfit.length > 1;
            const marginRate = market.marginRate;
            
            return (
              <div
                key={market.id}
                className={`p-4 border rounded-lg flex items-center justify-between ${
                  isBest ? 'border-yellow-300 bg-yellow-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {isBest && <Trophy className="h-4 w-4 text-yellow-500" />}
                  <Badge variant="secondary">
                    {getChannelName(market.channel)}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    판매가: {formatCurrency(market.selling_price)}
                  </span>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">순이익</p>
                    <p className={`font-bold ${market.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(market.netProfit)}
                    </p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-xs text-muted-foreground">마진율</p>
                    <div className="flex items-center justify-end gap-1">
                      {marginRate > 20 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : marginRate > 0 ? (
                        <Minus className="h-3 w-3 text-yellow-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`font-bold ${
                        marginRate > 20 ? 'text-green-600' : 
                        marginRate > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {marginRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 수익 차이 */}
        {marketsWithProfit.length > 1 && (
          <div className="text-center text-sm text-muted-foreground pt-2 border-t">
            최고-최저 수익 차이: {' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(bestMarket.netProfit - worstMarket.netProfit)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
