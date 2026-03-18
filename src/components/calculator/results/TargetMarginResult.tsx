'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatPercent } from '@/lib/calculator';
import type { CalculationResult } from '@/types';
import { Target, AlertTriangle } from 'lucide-react';

interface TargetMarginResultProps {
  result: (CalculationResult & { targetRecommendedPrice: number }) | null;
  targetMarginRate: number;
  isValid: boolean;
}

export function TargetMarginResult({ result, targetMarginRate, isValid }: TargetMarginResultProps) {
  if (!isValid) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            목표 마진 기준 결과
          </CardTitle>
          <CardDescription>
            원하는 마진율에 맞는 판매가를 계산합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            원가와 목표 마진율을 입력하면 결과가 표시됩니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const isValidPrice = result && result.targetRecommendedPrice > 0 && result.targetRecommendedPrice < Infinity;

  return (
    <Card className="border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" />
          목표 마진 기준 결과
        </CardTitle>
        <CardDescription>
          {formatPercent(targetMarginRate)} 마진율을 달성하기 위한 권장 판매가입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isValidPrice ? (
          <>
            <div className="text-center p-6 bg-white/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">권장 판매가</p>
              <p className="text-4xl font-bold text-primary">
                {formatCurrency(result.targetRecommendedPrice)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                이 가격으로 판매하면 {formatPercent(targetMarginRate)} 마진을 확보할 수 있습니다
              </p>
            </div>

            {result && (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">예상 순이익</p>
                  <p className="text-xl font-semibold text-[#4a5abf]">
                    {formatCurrency(result.netProfit)}
                  </p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">총 차감 비용</p>
                  <p className="text-xl font-semibold text-gray-700">
                    {formatCurrency(result.totalDeductions)}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              현재 비용 구조에서는 {formatPercent(targetMarginRate)} 마진을 달성하기 어렵습니다.
              비용을 줄이거나 목표 마진율을 조정해보세요.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
