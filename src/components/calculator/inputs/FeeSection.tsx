'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInput } from './NumberInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface FeeSectionProps {
  platformFeeRate: string;
  paymentFeeRate: string;
  couponBurden: string;
  onPlatformFeeRateChange: (value: string) => void;
  onPaymentFeeRateChange: (value: string) => void;
  onCouponBurdenChange: (value: string) => void;
  errors?: {
    platformFeeRate?: string;
    paymentFeeRate?: string;
    couponBurden?: string;
  };
}

export function FeeSection({
  platformFeeRate,
  paymentFeeRate,
  couponBurden,
  onPlatformFeeRateChange,
  onPaymentFeeRateChange,
  onCouponBurdenChange,
  errors,
}: FeeSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">수수료 정보</CardTitle>
        <CardDescription>
          판매 채널과 결제 과정에서 차감되는 비용입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NumberInput
          label="플랫폼 수수료율"
          value={platformFeeRate}
          onChange={onPlatformFeeRateChange}
          suffix="%"
          description="판매 채널에서 차감하는 수수료"
          inputMode="decimal"
          error={errors?.platformFeeRate}
        />

        <NumberInput
          label="결제 수수료율"
          value={paymentFeeRate}
          onChange={onPaymentFeeRateChange}
          suffix="%"
          description="PG 또는 카드 결제 수수료"
          inputMode="decimal"
          error={errors?.paymentFeeRate}
        />

        <NumberInput
          label="쿠폰 부담금"
          value={couponBurden}
          onChange={onCouponBurdenChange}
          suffix="원"
          description="판매자가 부담하는 쿠폰 비용"
          error={errors?.couponBurden}
        />

        <Alert className="bg-muted/50">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm text-muted-foreground">
            기본값이 자동 입력되며, 실제 조건에 맞게 수정할 수 있습니다
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
