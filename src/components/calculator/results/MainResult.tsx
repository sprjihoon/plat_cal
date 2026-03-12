'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent, getMarginColorClass, getMarginBgClass } from '@/lib/calculator';
import type { CalculationResult } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MainResultProps {
  result: CalculationResult | null;
  isValid: boolean;
}

export function MainResult({ result, isValid }: MainResultProps) {
  if (!result || !isValid) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">계산 결과</CardTitle>
          <CardDescription>
            입력한 조건 기준으로 한 건 판매 시 예상되는 결과입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            판매가와 원가를 입력하면 결과가 표시됩니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const marginColorClass = getMarginColorClass(result.marginRate);
  const marginBgClass = getMarginBgClass(result.marginRate);

  const getProfitIcon = () => {
    if (result.netProfit > 0) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (result.netProfit < 0) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-400" />;
  };

  return (
    <Card className={cn('border-2', marginBgClass)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          계산 결과
          {getProfitIcon()}
        </CardTitle>
        <CardDescription>
          입력한 조건 기준으로 한 건 판매 시 예상되는 결과입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* 예상 순이익 */}
          <div className="text-center p-4 bg-white/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">예상 순이익</p>
            <p className={cn(
              'text-3xl font-bold',
              result.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {result.netProfit >= 0 ? '+' : ''}{formatCurrency(result.netProfit)}
            </p>
          </div>

          {/* 마진율과 총 차감 비용 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">최종 마진율</p>
              <p className={cn('text-2xl font-bold', marginColorClass)}>
                {formatPercent(result.marginRate)}
              </p>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">총 차감 비용</p>
              <p className="text-2xl font-bold text-gray-700">
                {formatCurrency(result.totalDeductions)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
