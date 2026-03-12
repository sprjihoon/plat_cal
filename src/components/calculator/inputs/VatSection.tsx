'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import type { VatType } from '@/types';

interface VatSectionProps {
  sellingPriceVatIncluded: boolean;
  wholesaleVatType: VatType;
  onSellingPriceVatIncludedChange: (value: boolean) => void;
  onWholesaleVatTypeChange: (value: VatType) => void;
}

export function VatSection({
  sellingPriceVatIncluded,
  wholesaleVatType,
  onSellingPriceVatIncludedChange,
  onWholesaleVatTypeChange,
}: VatSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">부가세 설정</CardTitle>
        <CardDescription>
          판매가와 원가의 부가세 계산 방식을 설정합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">판매가 VAT 포함</Label>
            <p className="text-xs text-muted-foreground">
              판매가에 부가세가 포함되어 있는지 여부
            </p>
          </div>
          <Switch
            checked={sellingPriceVatIncluded}
            onCheckedChange={onSellingPriceVatIncludedChange}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">도매가 VAT 방식</Label>
          <RadioGroup
            value={wholesaleVatType}
            onValueChange={(value) => onWholesaleVatTypeChange(value as VatType)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="excluded" id="vat-excluded" />
              <Label htmlFor="vat-excluded" className="text-sm font-normal cursor-pointer">
                VAT 별도
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="included" id="vat-included" />
              <Label htmlFor="vat-included" className="text-sm font-normal cursor-pointer">
                VAT 포함
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            도매처에서 받은 세금계산서 기준으로 선택하세요
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
