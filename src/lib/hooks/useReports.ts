'use client';

import { useQuery } from '@tanstack/react-query';

interface PeriodSummary {
  period: string;
  revenue: number;
  profit: number;
  quantity: number;
  salesCount: number;
  adCost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  netProfitAfterAd: number;
  roas: number;
  roi: number;
}

interface ChannelSummary {
  channel: string;
  revenue: number;
  profit: number;
  quantity: number;
  count: number;
  adCost?: number;
}

interface ReportData {
  period: {
    startDate: string;
    endDate: string;
    groupBy: string;
  };
  totalSummary: {
    revenue: number;
    profit: number;
    quantity: number;
    salesCount: number;
    adCost: number;
    impressions: number;
    clicks: number;
    conversions: number;
    netProfitAfterAd: number;
    roas: number;
    roi: number;
  };
  periodSummaries: PeriodSummary[];
  channelSummary: ChannelSummary[];
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

async function fetchReport(filters: ReportFilters): Promise<ReportData> {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    groupBy: filters.groupBy || 'day',
  });

  const res = await fetch(`/api/reports?${params}`);
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

export function useReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => fetchReport(filters),
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

// 날짜 유틸리티
export function getDateRange(preset: string): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  let startDate: string;

  switch (preset) {
    case 'today':
      startDate = endDate;
      break;
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = yesterday.toISOString().split('T')[0];
      return { startDate, endDate: startDate };
    }
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
      break;
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
      break;
    }
    case 'quarter': {
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      startDate = quarterAgo.toISOString().split('T')[0];
      break;
    }
    case 'year': {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      startDate = yearAgo.toISOString().split('T')[0];
      break;
    }
    case 'thisMonth': {
      startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      break;
    }
    case 'lastMonth': {
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate, endDate: lastDayOfLastMonth.toISOString().split('T')[0] };
    }
    default:
      startDate = endDate;
  }

  return { startDate, endDate };
}
