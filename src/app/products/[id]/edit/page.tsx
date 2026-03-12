'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProduct, useUpdateProduct } from '@/lib/hooks/useProducts';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_PRESETS } from '@/constants';
import type { SalesChannel } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface MarketSetting {
  channel: string;
  sub_option_id: string | null;
  selling_price: number;
  platform_fee_rate: number;
  payment_fee_rate: number;
  additional_costs: {
    shipping_cost?: number;
    packaging_cost?: number;
    advertising_cost?: number;
    other_costs?: number;
  };
  is_active: boolean;
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [baseCost, setBaseCost] = useState(0);
  const [markets, setMarkets] = useState<MarketSetting[]>([]);
  const [initialized, setInitialized] = useState(false);

  // 초기 데이터 로드
  if (product && !initialized) {
    setName(product.name);
    setSku(product.sku || '');
    setBaseCost(product.base_cost);
    setMarkets(
      product.product_markets?.map((m) => ({
        channel: m.channel,
        sub_option_id: m.sub_option_id,
        selling_price: m.selling_price,
        platform_fee_rate: m.platform_fee_rate,
        payment_fee_rate: m.payment_fee_rate,
        additional_costs: (m.additional_costs as any) || {},
        is_active: m.is_active,
      })) || []
    );
    setInitialized(true);
  }

  const handleAddMarket = () => {
    setMarkets([
      ...markets,
      {
        channel: 'smartstore',
        sub_option_id: null,
        selling_price: 0,
        platform_fee_rate: PLATFORM_PRESETS.smartstore.platformFeeRate,
        payment_fee_rate: PLATFORM_PRESETS.smartstore.paymentFeeRate,
        additional_costs: {},
        is_active: true,
      },
    ]);
  };

  const handleRemoveMarket = (index: number) => {
    setMarkets(markets.filter((_, i) => i !== index));
  };

  const handleMarketChange = (index: number, field: keyof MarketSetting, value: any) => {
    const updated = [...markets];
    updated[index] = { ...updated[index], [field]: value };

    // 채널 변경 시 수수료 자동 업데이트
    if (field === 'channel') {
      const preset = PLATFORM_PRESETS[value as SalesChannel];
      if (preset) {
        updated[index].platform_fee_rate = preset.platformFeeRate;
        updated[index].payment_fee_rate = preset.paymentFeeRate;
        updated[index].sub_option_id = null;
      }
    }

    setMarkets(updated);
  };

  const handleAdditionalCostChange = (index: number, costField: string, value: number) => {
    const updated = [...markets];
    updated[index] = {
      ...updated[index],
      additional_costs: {
        ...updated[index].additional_costs,
        [costField]: value,
      },
    };
    setMarkets(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateProduct.mutateAsync({
      id,
      data: {
        name,
        sku: sku || null,
        base_cost: baseCost,
        markets,
      },
    });

    router.push(`/products/${id}`);
  };

  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold">마진 계산기</Link>
            <nav className="hidden sm:flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">대시보드</Button>
              </Link>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="bg-gray-100">상품 관리</Button>
              </Link>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-4">
          <Link href={`/products/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">상품 수정</h1>
            <p className="text-muted-foreground">{product?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">상품명 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU (관리코드)</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseCost">기본 원가 (원)</Label>
                <Input
                  id="baseCost"
                  type="number"
                  value={baseCost}
                  onChange={(e) => setBaseCost(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* 마켓 설정 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>마켓별 설정</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddMarket}>
                <Plus className="h-4 w-4 mr-2" />
                마켓 추가
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {markets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>등록된 마켓이 없습니다</p>
                  <Button type="button" variant="link" onClick={handleAddMarket}>
                    마켓 추가하기
                  </Button>
                </div>
              ) : (
                markets.map((market, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`active-${index}`}
                          checked={market.is_active}
                          onCheckedChange={(checked) =>
                            handleMarketChange(index, 'is_active', checked)
                          }
                        />
                        <Label htmlFor={`active-${index}`} className="text-sm">
                          활성화
                        </Label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMarket(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>판매 채널</Label>
                        <select
                          className="w-full h-10 px-3 border rounded-md"
                          value={market.channel}
                          onChange={(e) =>
                            handleMarketChange(index, 'channel', e.target.value)
                          }
                        >
                          {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                            <option key={key} value={key}>
                              {preset.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>판매가 (원)</Label>
                        <Input
                          type="number"
                          value={market.selling_price}
                          onChange={(e) =>
                            handleMarketChange(index, 'selling_price', Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>플랫폼 수수료 (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={market.platform_fee_rate}
                          onChange={(e) =>
                            handleMarketChange(index, 'platform_fee_rate', Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>결제 수수료 (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={market.payment_fee_rate}
                          onChange={(e) =>
                            handleMarketChange(index, 'payment_fee_rate', Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>배송비 (원)</Label>
                        <Input
                          type="number"
                          value={market.additional_costs.shipping_cost || 0}
                          onChange={(e) =>
                            handleAdditionalCostChange(index, 'shipping_cost', Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>포장비 (원)</Label>
                        <Input
                          type="number"
                          value={market.additional_costs.packaging_cost || 0}
                          onChange={(e) =>
                            handleAdditionalCostChange(index, 'packaging_cost', Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Link href={`/products/${id}`}>
              <Button type="button" variant="outline">취소</Button>
            </Link>
            <Button type="submit" disabled={updateProduct.isPending}>
              {updateProduct.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              저장
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
