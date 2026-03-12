'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInput } from './NumberInput';

interface TargetMarginSectionProps {
  targetMarginRate: string;
  onTargetMarginRateChange: (value: string) => void;
  error?: string;
}

export function TargetMarginSection({
  targetMarginRate,
  onTargetMarginRateChange,
  error,
}: TargetMarginSectionProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">목표 마진율</CardTitle>
        <CardDescription>
          달성하고 싶은 마진율을 입력하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NumberInput
          label="목표 마진율"
          value={targetMarginRate}
          onChange={onTargetMarginRateChange}
          suffix="%"
          placeholder="30"
          inputMode="decimal"
          error={error}
        />
      </CardContent>
    </Card>
  );
}
