'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInput } from './NumberInput';

interface ShippingSectionProps {
  sellerShippingCost: string;
  customerShippingCost: string;
  packagingCost: string;
  materialCost: string;
  onSellerShippingCostChange: (value: string) => void;
  onCustomerShippingCostChange: (value: string) => void;
  onPackagingCostChange: (value: string) => void;
  onMaterialCostChange: (value: string) => void;
  errors?: {
    sellerShippingCost?: string;
    customerShippingCost?: string;
    packagingCost?: string;
    materialCost?: string;
  };
}

export function ShippingSection({
  sellerShippingCost,
  customerShippingCost,
  packagingCost,
  materialCost,
  onSellerShippingCostChange,
  onCustomerShippingCostChange,
  onPackagingCostChange,
  onMaterialCostChange,
  errors,
}: ShippingSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">배송 및 포장 비용</CardTitle>
        <CardDescription>
          한 건 판매할 때 발생하는 물류 비용입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="판매자 부담 배송비"
            value={sellerShippingCost}
            onChange={onSellerShippingCostChange}
            suffix="원"
            error={errors?.sellerShippingCost}
          />

          <NumberInput
            label="고객 부담 배송비"
            value={customerShippingCost}
            onChange={onCustomerShippingCostChange}
            suffix="원"
            error={errors?.customerShippingCost}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="포장비"
            value={packagingCost}
            onChange={onPackagingCostChange}
            suffix="원"
            error={errors?.packagingCost}
          />

          <NumberInput
            label="부자재비"
            value={materialCost}
            onChange={onMaterialCostChange}
            suffix="원"
            error={errors?.materialCost}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          판매자 부담 배송비: 무료배송 또는 일부 부담 금액 | 포장비: 박스, 봉투 등 | 부자재비: 스티커, 완충재, 리플렛 등
        </p>
      </CardContent>
    </Card>
  );
}
