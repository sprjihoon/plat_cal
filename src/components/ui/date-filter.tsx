'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, X } from 'lucide-react';

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getThisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: getToday(),
  };
}

function getLastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
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
  const [activeKey, setActiveKey] = useState<ActiveKey>(
    defaultQuick === 0 ? 'today' : null
  );

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

  const quickButtons = [
    { key: 'today', label: '오늘', action: () => { const t = getToday(); applyRange('today', t, t); } },
    { key: 'yesterday', label: '어제', action: () => { const y = getYesterday(); applyRange('yesterday', y, y); } },
    { key: 'week', label: '최근 1주일', action: () => { const r = getQuickRange(7); applyRange('week', r.startDate, r.endDate); } },
    { key: 'thisMonth', label: '이번달', action: () => { const r = getThisMonthRange(); applyRange('thisMonth', r.startDate, r.endDate); } },
    { key: 'lastMonth', label: '지난달', action: () => { const r = getLastMonthRange(); applyRange('lastMonth', r.startDate, r.endDate); } },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      {showQuickRanges && (
        <div className="flex flex-wrap gap-1.5">
          {quickButtons.map((btn) => (
            <Button
              key={btn.key}
              variant={activeKey === btn.key ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={btn.action}
            >
              {btn.label}
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
