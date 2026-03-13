'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, X } from 'lucide-react';

const QUICK_RANGES = [
  { label: '오늘', days: 0 },
  { label: '7일', days: 7 },
  { label: '14일', days: 14 },
  { label: '1개월', days: 30 },
  { label: '3개월', days: 90 },
  { label: '6개월', days: 180 },
  { label: '1년', days: 365 },
] as const;

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getQuickRange(days: number) {
  const end = new Date();
  const start = new Date();
  if (days === 0) {
    return { startDate: getToday(), endDate: getToday() };
  }
  start.setDate(start.getDate() - days);
  return { startDate: start.toISOString().split('T')[0], endDate: getToday() };
}

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear?: () => void;
  showQuickRanges?: boolean;
  /** 초기 활성화할 퀵 범위 (days). 0=오늘, 7=7일, 30=1개월 등 */
  defaultQuick?: number;
  className?: string;
}

export function DateFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  showQuickRanges = true,
  defaultQuick,
  className = '',
}: DateFilterProps) {
  const [activeQuick, setActiveQuick] = useState<number | null>(defaultQuick ?? null);

  useEffect(() => {
    if (defaultQuick !== undefined && !startDate && !endDate) {
      const { startDate: s, endDate: e } = getQuickRange(defaultQuick);
      onStartDateChange(s);
      onEndDateChange(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickRange = useCallback((days: number) => {
    const { startDate: s, endDate: e } = getQuickRange(days);
    onStartDateChange(s);
    onEndDateChange(e);
    setActiveQuick(days);
  }, [onStartDateChange, onEndDateChange]);

  const handleClear = useCallback(() => {
    onStartDateChange('');
    onEndDateChange('');
    setActiveQuick(null);
    onClear?.();
  }, [onStartDateChange, onEndDateChange, onClear]);

  const handleManualChange = useCallback((type: 'start' | 'end', value: string) => {
    setActiveQuick(null);
    if (type === 'start') onStartDateChange(value);
    else onEndDateChange(value);
  }, [onStartDateChange, onEndDateChange]);

  const hasFilter = startDate || endDate;

  return (
    <div className={`space-y-2 ${className}`}>
      {showQuickRanges && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_RANGES.map((range) => (
            <Button
              key={range.days}
              variant={activeQuick === range.days ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleQuickRange(range.days)}
            >
              {range.label}
            </Button>
          ))}
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={handleClear}
            >
              <X className="h-3 w-3 mr-1" />
              전체
            </Button>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => handleManualChange('start', e.target.value)}
          className="h-8 text-sm w-[140px]"
        />
        <span className="text-muted-foreground text-sm">~</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => handleManualChange('end', e.target.value)}
          className="h-8 text-sm w-[140px]"
        />
      </div>
    </div>
  );
}
