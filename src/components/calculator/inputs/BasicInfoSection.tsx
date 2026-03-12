'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInput } from './NumberInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface BasicInfoSectionProps {
  sellingPrice: string;
  productCost: string;
  discountRate: string;
  discountAmount: string;
  onSellingPriceChange: (value: string) => void;
  onProductCostChange: (value: string) => void;
  onDiscountRateChange: (value: string) => void;
  onDiscountAmountChange: (value: string) => void;
  errors?: {
    sellingPrice?: string;
    productCost?: string;
    discountRate?: string;
    discountAmount?: string;
  };
  actualSellingPrice?: number;
}

export function BasicInfoSection({
  sellingPrice,
  productCost,
  discountRate,
  discountAmount,
  onSellingPriceChange,
  onProductCostChange,
  onDiscountRateChange,
  onDiscountAmountChange,
  errors,
  actualSellingPrice,
}: BasicInfoSectionProps) {
  const hasDiscount =
    (discountRate && parseFloat(discountRate.replace(/,/g, '')) > 0) ||
    (discountAmount && parseFloat(discountAmount.replace(/,/g, '')) > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">기본 판매 정보</CardTitle>
        <CardDescription>상품 가격과 원가를 입력해주세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NumberInput
          label="판매가"
          value={sellingPrice}
          onChange={onSellingPriceChange}
          suffix="원"
          description="고객에게 노출되는 최종 판매 가격 (VAT 포함 기준)"
          error={errors?.sellingPrice}
        />

        <NumberInput
          label="상품 원가"
          value={productCost}
          onChange={onProductCostChange}
          suffix="원"
          description="도매 공급가 또는 제조 원가"
          error={errors?.productCost}
        />

        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="할인율"
            value={discountRate}
            onChange={(value) => {
              onDiscountRateChange(value);
              if (value && parseFloat(value.replace(/,/g, '')) > 0) {
                onDiscountAmountChange('');
              }
            }}
            suffix="%"
            placeholder="0"
            inputMode="decimal"
            error={errors?.discountRate}
            disabled={!!discountAmount && parseFloat(discountAmount.replace(/,/g, '')) > 0}
          />

          <NumberInput
            label="할인 금액"
            value={discountAmount}
            onChange={(value) => {
              onDiscountAmountChange(value);
              if (value && parseFloat(value.replace(/,/g, '')) > 0) {
                onDiscountRateChange('');
              }
            }}
            suffix="원"
            placeholder="0"
            error={errors?.discountAmount}
            disabled={!!discountRate && parseFloat(discountRate.replace(/,/g, '')) > 0}
          />
        </div>

        {hasDiscount && actualSellingPrice !== undefined && actualSellingPrice > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              실제 판매가: <span className="font-semibold">{actualSellingPrice.toLocaleString()}원</span>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
