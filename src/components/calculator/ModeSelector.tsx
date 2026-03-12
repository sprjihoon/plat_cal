'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CalculationMode } from '@/types';
import { Calculator, Target, Package } from 'lucide-react';

interface ModeSelectorProps {
  value: CalculationMode;
  onChange: (value: CalculationMode) => void;
}

const modes = [
  {
    id: 'price_based' as const,
    label: '판매가 기준',
    icon: Calculator,
    description: '이 가격에 팔면 얼마나 남는지 계산합니다',
  },
  {
    id: 'target_margin' as const,
    label: '목표 마진 기준',
    icon: Target,
    description: '원하는 마진율에 맞는 판매가를 계산합니다',
  },
  {
    id: 'max_cost' as const,
    label: '허용 원가 기준',
    icon: Package,
    description: '현재 판매가에서 맞출 수 있는 최대 원가를 계산합니다',
  },
];

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  const currentMode = modes.find((m) => m.id === value);

  return (
    <div className="space-y-2">
      <Tabs value={value} onValueChange={(v) => onChange(v as CalculationMode)}>
        <TabsList className="grid w-full grid-cols-3">
          {modes.map((mode) => (
            <TabsTrigger
              key={mode.id}
              value={mode.id}
              className="flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <mode.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{mode.label}</span>
              <span className="sm:hidden">{mode.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {currentMode && (
        <p className="text-xs text-muted-foreground text-center">
          {currentMode.description}
        </p>
      )}
    </div>
  );
}
