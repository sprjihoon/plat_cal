'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { PLATFORM_PRESETS } from '@/constants';
import type { Product, ProductMarket } from '@/types/database';
import type { SalesChannel } from '@/types';

const productSchema = z.object({
  name: z.string().min(1, '상품명을 입력하세요'),
  sku: z.string().optional(),
  base_cost: z.number().min(0, '원가는 0 이상이어야 합니다'),
});

type ProductFormData = z.infer<typeof productSchema>;

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

interface ProductFormProps {
  initialData?: Product & { product_markets?: ProductMarket[] };
  onSubmit: (data: ProductFormData & { markets?: MarketSetting[] }) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [markets, setMarkets] = useState<MarketSetting[]>(
    initialData?.product_markets?.map((m) => ({
      channel: m.channel,
      sub_option_id: m.sub_option_id,
      selling_price: m.selling_price,
      platform_fee_rate: m.platform_fee_rate,
      payment_fee_rate: m.payment_fee_rate,
      additional_costs: (m.additional_costs as any) || {},
      is_active: m.is_active,
    })) || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      sku: initialData?.sku || '',
      base_cost: initialData?.base_cost || 0,
    },
  });

  const handleFormSubmit = async (data: ProductFormData) => {
    setError(null);
    try {
      await onSubmit({ ...data, markets });
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  };

  const getSubOptions = (channel: string) => {
    const preset = PLATFORM_PRESETS[channel as SalesChannel];
    return preset?.subOptions || [];
  };

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

  const handleSubOptionChange = (index: number, subOptionId: string) => {
    const updated = [...markets];
    const preset = PLATFORM_PRESETS[updated[index].channel as SalesChannel];
    const subOption = preset?.subOptions?.find(o => o.id === subOptionId);

    if (subOption) {
      updated[index] = {
        ...updated[index],
        sub_option_id: subOptionId,
        platform_fee_rate: subOption.platformFeeRate,
        payment_fee_rate: subOption.paymentFeeRate,
      };
    } else {
      updated[index].sub_option_id = null;
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

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">상품명 *</Label>
            <Input
              id="name"
              placeholder="예: 여성 니트 가디건"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU (관리코드)</Label>
            <Input
              id="sku"
              placeholder="예: KNT-001"
              {...register('sku')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_cost">기본 원가 (원)</Label>
            <Input
              id="base_cost"
              type="number"
              placeholder="0"
              {...register('base_cost', { valueAsNumber: true })}
            />
            {errors.base_cost && (
              <p className="text-sm text-red-500">{errors.base_cost.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 마켓별 설정 */}
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
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">마켓을 추가하면 채널별 수익을 비교할 수 있습니다</p>
              <Button type="button" variant="link" size="sm" onClick={handleAddMarket}>
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
                    <Label htmlFor={`active-${index}`} className="text-sm">활성화</Label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>판매 채널</Label>
                    <select
                      className="w-full h-10 px-3 border rounded-md bg-white text-sm"
                      value={market.channel}
                      onChange={(e) => handleMarketChange(index, 'channel', e.target.value)}
                    >
                      {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                        <option key={key} value={key}>{preset.name}</option>
                      ))}
                    </select>
                  </div>

                  {getSubOptions(market.channel).length > 0 && (
                    <div className="space-y-2">
                      <Label>판매방식 / 카테고리</Label>
                      <select
                        className="w-full h-10 px-3 border rounded-md bg-white text-sm"
                        value={market.sub_option_id || ''}
                        onChange={(e) => handleSubOptionChange(index, e.target.value)}
                      >
                        <option value="">기본 수수료</option>
                        {getSubOptions(market.channel).map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name} ({opt.platformFeeRate + opt.paymentFeeRate}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {market.sub_option_id && (() => {
                  const subOpt = getSubOptions(market.channel).find(o => o.id === market.sub_option_id);
                  return subOpt?.description ? (
                    <p className="text-xs text-muted-foreground bg-blue-50 px-3 py-2 rounded-md">
                      {subOpt.description}
                    </p>
                  ) : null;
                })()}

                <div className="space-y-2">
                  <Label>판매가 (원)</Label>
                  <Input
                    type="number"
                    value={market.selling_price}
                    onChange={(e) => handleMarketChange(index, 'selling_price', Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>플랫폼 수수료 (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={market.platform_fee_rate}
                      onChange={(e) => handleMarketChange(index, 'platform_fee_rate', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>결제 수수료 (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={market.payment_fee_rate}
                      onChange={(e) => handleMarketChange(index, 'payment_fee_rate', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>배송비 (원)</Label>
                    <Input
                      type="number"
                      value={market.additional_costs.shipping_cost || 0}
                      onChange={(e) => handleAdditionalCostChange(index, 'shipping_cost', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>포장비 (원)</Label>
                    <Input
                      type="number"
                      value={market.additional_costs.packaging_cost || 0}
                      onChange={(e) => handleAdditionalCostChange(index, 'packaging_cost', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData ? '저장' : '등록'}
        </Button>
      </div>
    </form>
  );
}
