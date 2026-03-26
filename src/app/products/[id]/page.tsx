'use client';

import { use } from 'react';
import { useProduct } from '@/lib/hooks/useProducts';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';
import { calculateMargin } from '@/lib/calculator';
import type { CalculatorInputs } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: product, isLoading, error } = useProduct(id);

  const getChannelName = (channel: string) => {
    return PLATFORM_PRESETS[channel as keyof typeof PLATFORM_PRESETS]?.name || channel;
  };

  const getSubOptionName = (channel: string, subOptionId: string | null) => {
    if (!subOptionId) return null;
    const preset = PLATFORM_PRESETS[channel as keyof typeof PLATFORM_PRESETS];
    return preset?.subOptions?.find(o => o.id === subOptionId)?.name || null;
  };

  const calculateProfit = (market: any, baseCost: number) => {
    const additionalCosts = market.additional_costs || {};
    
    const inputs: CalculatorInputs = {
      sellingPrice: market.selling_price,
      productCost: baseCost,
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
      wholesaleVatType: 'included',
      targetMarginRate: 30,
    };

    try {
      return calculateMargin(inputs);
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-background">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">상품을 찾을 수 없습니다</p>
          <Link href="/products" className="mt-4 inline-block">
            <Button variant="outline">상품 목록으로</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-3 py-4 space-y-4 sm:px-4 sm:py-6 sm:space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/products">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{product.name}</h1>
              {product.sku && (
                <p className="text-muted-foreground">SKU: {product.sku}</p>
              )}
            </div>
          </div>
          <Link href={`/products/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              수정
            </Button>
          </Link>
        </div>

        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">원가</p>
                <p className="text-lg font-semibold">{formatCurrency(product.base_cost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">판매 마켓</p>
                <p className="text-lg font-semibold">{product.product_markets?.length || 0}개</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">등록일</p>
                <p className="text-lg font-semibold">
                  {new Date(product.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 마켓별 수익 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>마켓별 수익</CardTitle>
            <Link href={`/products/${id}/edit`}>
              <Button variant="outline" size="sm">마켓 설정</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {product.product_markets?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>등록된 마켓이 없습니다</p>
                <Link href={`/products/${id}/edit`}>
                  <Button variant="link" className="mt-2">마켓 추가하기</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {product.product_markets?.map((market) => {
                  const result = calculateProfit(market, product.base_cost);
                  const marginRate = result?.marginRate || 0;
                  
                  return (
                    <div key={market.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={market.is_active ? 'default' : 'secondary'}>
                          {getChannelName(market.channel)}
                        </Badge>
                        {getSubOptionName(market.channel, market.sub_option_id) && (
                          <Badge variant="outline" className="text-xs">
                            {getSubOptionName(market.channel, market.sub_option_id)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">판매가</p>
                          <p className="text-sm sm:text-base font-semibold">{formatCurrency(market.selling_price)}</p>
                        </div>
                        {result ? (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground">순이익</p>
                              <p className={`text-sm sm:text-base font-bold ${result.netProfit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
                                {formatCurrency(result.netProfit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">마진율</p>
                              <div className="flex items-center gap-1">
                                {marginRate > 20 ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-[#4a5abf]" />
                                ) : marginRate > 0 ? (
                                  <Minus className="h-3.5 w-3.5 text-yellow-600" />
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                                )}
                                <p className={`text-sm sm:text-base font-bold ${
                                  marginRate > 20 ? 'text-[#4a5abf]' : 
                                  marginRate > 0 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {marginRate.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2 flex items-center">
                            <span className="text-muted-foreground text-sm">계산 불가</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
