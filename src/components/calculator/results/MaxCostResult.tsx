'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatPercent } from '@/lib/calculator';
import type { CalculationResult } from '@/types';
import { Package, AlertTriangle } from 'lucide-react';

interface MaxCostResultProps {
  result: (CalculationResult & { calculatedMaxCost: number }) | null;
  targetMarginRate: number;
  isValid: boolean;
}

export function MaxCostResult({ result, targetMarginRate, isValid }: MaxCostResultProps) {
  if (!isValid) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            원가 찾기 결과
          </CardTitle>
          <CardDescription>
            현재 판매가에서 맞출 수 있는 최대 원가를 찾습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            판매가와 목표 마진율을 입력하면 결과가 표시됩니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const isValidCost = result && result.calculatedMaxCost > 0;

  return (
    <Card className="border-2 border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          원가 찾기 결과
        </CardTitle>
        <CardDescription>
          {formatPercent(targetMarginRate)} 마진율을 유지하기 위한 최대 원가입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isValidCost ? (
          <>
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">맞출 수 있는 최대 원가</p>
              <p className="text-4xl font-bold text-orange-600">
                {formatCurrency(result.calculatedMaxCost)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                원가가 이 금액 이하여야 {formatPercent(targetMarginRate)} 마진을 확보할 수 있습니다
              </p>
            </div>

            {result && (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">예상 순이익</p>
                  <p className="text-xl font-semibold text-[#4a5abf]">
                    {formatCurrency(result.netProfit)}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">예상 마진율</p>
                  <p className="text-xl font-semibold text-orange-600">
                    {formatPercent(result.marginRate)}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              현재 구조에서는 원가를 맞추기 어렵습니다.
              판매가를 올리거나 비용을 줄여보세요.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
