'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInput } from './NumberInput';

interface AdditionalCostSectionProps {
  advertisingCost: string;
  otherCosts: string;
  onAdvertisingCostChange: (value: string) => void;
  onOtherCostsChange: (value: string) => void;
  errors?: {
    advertisingCost?: string;
    otherCosts?: string;
  };
}

export function AdditionalCostSection({
  advertisingCost,
  otherCosts,
  onAdvertisingCostChange,
  onOtherCostsChange,
  errors,
}: AdditionalCostSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">광고 및 기타 비용</CardTitle>
        <CardDescription>
          상품 1건 기준으로 나눠서 반영할 비용입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NumberInput
          label="광고비"
          value={advertisingCost}
          onChange={onAdvertisingCostChange}
          suffix="원"
          description="주문 1건당 배분한 광고비"
          error={errors?.advertisingCost}
        />

        <NumberInput
          label="기타 비용"
          value={otherCosts}
          onChange={onOtherCostsChange}
          suffix="원"
          description="사은품, 외주비, 추가 작업비 등"
          error={errors?.otherCosts}
        />
      </CardContent>
    </Card>
  );
}
