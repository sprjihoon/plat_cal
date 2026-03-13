'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, X, ChevronLeft, ChevronRight } from 'lucide-react';

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

function getQuarterRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function getHalfRange(year: number, half: 1 | 2) {
  const start = new Date(year, half === 1 ? 0 : 6, 1);
  const end = new Date(year, half === 1 ? 6 : 12, 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function getYearRange(year: number) {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

type ActiveKey = string | null;

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear?: () => void;
  showQuickRanges?: boolean;
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
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [activeKey, setActiveKey] = useState<ActiveKey>(
    defaultQuick === 0 ? 'today' : null
  );
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    if (defaultQuick !== undefined && !startDate && !endDate) {
      const { startDate: s, endDate: e } = getQuickRange(defaultQuick);
      onStartDateChange(s);
      onEndDateChange(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyRange = useCallback((key: string, s: string, e: string) => {
    onStartDateChange(s);
    onEndDateChange(e);
    setActiveKey(key);
  }, [onStartDateChange, onEndDateChange]);

  const handleToday = useCallback(() => {
    const t = getToday();
    applyRange('today', t, t);
  }, [applyRange]);

  const handleWeek = useCallback(() => {
    const { startDate: s, endDate: e } = getQuickRange(7);
    applyRange('week', s, e);
  }, [applyRange]);

  const handleMonth = useCallback((month: number) => {
    const { startDate: s, endDate: e } = getMonthRange(selectedYear, month);
    applyRange(`month-${selectedYear}-${month}`, s, e);
  }, [applyRange, selectedYear]);

  const handleQuarter = useCallback((q: number) => {
    const { startDate: s, endDate: e } = getQuarterRange(selectedYear, q);
    applyRange(`q${q}-${selectedYear}`, s, e);
  }, [applyRange, selectedYear]);

  const handleHalf = useCallback((h: 1 | 2) => {
    const { startDate: s, endDate: e } = getHalfRange(selectedYear, h);
    applyRange(`h${h}-${selectedYear}`, s, e);
  }, [applyRange, selectedYear]);

  const handleYear = useCallback(() => {
    const { startDate: s, endDate: e } = getYearRange(selectedYear);
    applyRange(`year-${selectedYear}`, s, e);
  }, [applyRange, selectedYear]);

  const handleClear = useCallback(() => {
    onStartDateChange('');
    onEndDateChange('');
    setActiveKey(null);
    onClear?.();
  }, [onStartDateChange, onEndDateChange, onClear]);

  const handleManualChange = useCallback((type: 'start' | 'end', value: string) => {
    setActiveKey(null);
    if (type === 'start') onStartDateChange(value);
    else onEndDateChange(value);
  }, [onStartDateChange, onEndDateChange]);

  const hasFilter = startDate || endDate;
  const currentMonth = new Date().getMonth();

  const quarterLabels = useMemo(() => [
    { q: 1, label: 'Q1 (1~3월)' },
    { q: 2, label: 'Q2 (4~6월)' },
    { q: 3, label: 'Q3 (7~9월)' },
    { q: 4, label: 'Q4 (10~12월)' },
  ], []);

  return (
    <div className={`space-y-2 ${className}`}>
      {showQuickRanges && (
        <div className="space-y-2">
          {/* 빠른 선택 */}
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={activeKey === 'today' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={handleToday}
            >
              오늘
            </Button>
            <Button
              variant={activeKey === 'week' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={handleWeek}
            >
              최근 7일
            </Button>

            <span className="border-l mx-1" />

            {/* 연도 선택 */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedYear(y => y - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={activeKey === `year-${selectedYear}` ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs font-semibold min-w-[60px]"
                onClick={handleYear}
              >
                {selectedYear}년
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedYear(y => y + 1)}
                disabled={selectedYear >= currentYear}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <span className="border-l mx-1" />

            {/* 반기 */}
            <Button
              variant={activeKey === `h1-${selectedYear}` ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleHalf(1)}
            >
              상반기
            </Button>
            <Button
              variant={activeKey === `h2-${selectedYear}` ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleHalf(2)}
            >
              하반기
            </Button>

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

          {/* 분기별 */}
          <div className="flex flex-wrap gap-1.5">
            {quarterLabels.map(({ q, label }) => (
              <Button
                key={q}
                variant={activeKey === `q${q}-${selectedYear}` ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleQuarter(q)}
              >
                {label}
              </Button>
            ))}

            <span className="border-l mx-1" />

            {/* 월별 (현재 분기 기준 표시) */}
            {Array.from({ length: 12 }, (_, i) => (
              <Button
                key={i}
                variant={activeKey === `month-${selectedYear}-${i}` ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => handleMonth(i)}
              >
                {i + 1}월
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 직접 입력 */}
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
