'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateSale } from '@/lib/hooks/useSales';
import { useProducts } from '@/lib/hooks/useProducts';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_PRESETS } from '@/constants';
import { calculateMargin, formatCurrency } from '@/lib/calculator';
import type { CalculatorInputs } from '@/types';

export default function NewSalePage() {
  const router = useRouter();
  const createSale = useCreateSale();
  const { data: productsData } = useProducts(1, 100);

  const [productId, setProductId] = useState('');
  const [channel, setChannel] = useState('smartstore');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [platformFeeRate, setPlatformFeeRate] = useState(3);
  const [paymentFeeRate, setPaymentFeeRate] = useState(3.63);
  const [error, setError] = useState<string | null>(null);

  // 선택된 상품 정보
  const selectedProduct = productsData?.products.find((p) => p.id === productId);

  // 채널 변경 시 수수료 자동 설정
  useEffect(() => {
    const preset = PLATFORM_PRESETS[channel as keyof typeof PLATFORM_PRESETS];
    if (preset) {
      setPlatformFeeRate(preset.platformFeeRate);
      setPaymentFeeRate(preset.paymentFeeRate);
    }
  }, [channel]);

  // 수익 계산
  const calculateProfit = () => {
    if (!selectedProduct || unitPrice <= 0) return null;

    const inputs: CalculatorInputs = {
      sellingPrice: unitPrice,
      productCost: selectedProduct.base_cost,
      discountRate: 0,
      discountAmount: 0,
      platformFeeRate,
      paymentFeeRate,
      couponBurden: 0,
      sellerShippingCost: 0,
      customerShippingCost: 0,
      packagingCost: 0,
      materialCost: 0,
      advertisingCost: 0,
      otherCosts: 0,
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

  const profitResult = calculateProfit();
  const totalRevenue = quantity * unitPrice;
  const platformFee = totalRevenue * (platformFeeRate / 100);
  const paymentFee = totalRevenue * (paymentFeeRate / 100);
  const netProfit = profitResult ? profitResult.netProfit * quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId) {
      setError('상품을 선택하세요');
      return;
    }

    try {
      await createSale.mutateAsync({
        product_id: productId,
        channel,
        sale_date: saleDate,
        quantity,
        unit_price: unitPrice,
        total_revenue: totalRevenue,
        platform_fee: platformFee,
        payment_fee: paymentFee,
        net_profit: netProfit,
      });
      router.push('/sales');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-4">
          <Link href="/sales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">판매 기록 추가</h1>
            <p className="text-muted-foreground">새 판매 내역을 기록합니다</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>판매 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>판매일 *</Label>
                  <Input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>판매 채널 *</Label>
                  <select
                    className="w-full h-10 px-3 border rounded-md text-sm"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    required
                  >
                    {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key}>{preset.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>상품 *</Label>
                <select
                  className="w-full h-10 px-3 border rounded-md text-sm"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                >
                  <option value="">상품 선택</option>
                  {productsData?.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.sku ? `(${product.sku})` : ''}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="text-xs text-muted-foreground">
                    원가: {formatCurrency(selectedProduct.base_cost)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">판매 수량 *</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">판매 단가 (원) *</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">플랫폼 수수료 (%)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={platformFeeRate}
                    onChange={(e) => setPlatformFeeRate(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">결제 수수료 (%)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={paymentFeeRate}
                    onChange={(e) => setPaymentFeeRate(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 계산 결과 미리보기 */}
          {selectedProduct && unitPrice > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>예상 수익</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">총 매출</p>
                    <p className="text-lg font-semibold">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">플랫폼 수수료</p>
                    <p className="text-lg font-semibold text-red-600">-{formatCurrency(platformFee)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">결제 수수료</p>
                    <p className="text-lg font-semibold text-red-600">-{formatCurrency(paymentFee)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">예상 순이익</p>
                    <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
                      {formatCurrency(netProfit)}
                    </p>
                  </div>
                </div>
                {profitResult && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      개당 순이익: {formatCurrency(profitResult.netProfit)} | 
                      마진율: {profitResult.marginRate.toFixed(1)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Link href="/sales">
              <Button type="button" variant="outline">취소</Button>
            </Link>
            <Button type="submit" disabled={createSale.isPending}>
              {createSale.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              저장
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
