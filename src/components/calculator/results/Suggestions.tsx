'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/calculator';
import type { CalculationResult } from '@/types';
import { Lightbulb, TrendingDown } from 'lucide-react';

interface SuggestionsProps {
  result: CalculationResult | null;
  isValid: boolean;
}

interface SuggestionItemProps {
  label: string;
  value: string;
  description?: string;
  highlight?: boolean;
}

function SuggestionItem({ label, value, description, highlight }: SuggestionItemProps) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'}`}>
      <div className="flex justify-between items-start">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`text-sm font-semibold ${highlight ? 'text-primary' : ''}`}>
          {value}
        </span>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

export function Suggestions({ result, isValid }: SuggestionsProps) {
  if (!result || !isValid) {
    return null;
  }

  const isBreakEvenValid = result.breakEvenPrice > 0 && result.breakEvenPrice < Infinity;
  const isRecommendedValid = result.recommendedPrice > 0 && result.recommendedPrice < Infinity;
  const isMaxCostValid = result.maxAllowableCost > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          추가 제안
        </CardTitle>
        <CardDescription>
          가격 조정이나 할인 진행 전, 아래 수치를 꼭 확인해보세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isBreakEvenValid && (
          <SuggestionItem
            label="손익분기 판매가"
            value={formatCurrency(result.breakEvenPrice)}
            description="이 가격 이하로 팔면 적자입니다"
          />
        )}

        {isRecommendedValid && (
          <SuggestionItem
            label="권장 판매가 (30% 마진)"
            value={formatCurrency(result.recommendedPrice)}
            description="30% 마진을 확보하려면 이 가격 이상으로 설정하세요"
            highlight
          />
        )}

        {isMaxCostValid && (
          <SuggestionItem
            label="허용 가능한 최대 원가"
            value={formatCurrency(result.maxAllowableCost)}
            description="현재 마진율을 유지하려면 원가가 이 금액 이하여야 합니다"
          />
        )}

        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 text-orange-600 mt-0.5" />
            <div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-800">10% 할인 시 예상 순이익</span>
                <span className={`text-sm font-semibold ${result.profitAfter10PercentDiscount >= 0 ? 'text-orange-700' : 'text-red-600'}`}>
                  {result.profitAfter10PercentDiscount >= 0 ? '+' : ''}{formatCurrency(result.profitAfter10PercentDiscount)}
                </span>
              </div>
              <p className="text-xs text-orange-600 mt-1">
                {result.profitAfter10PercentDiscount < 0
                  ? '10% 할인 시 적자가 발생합니다'
                  : '할인 진행 시 마진이 줄어듭니다'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
