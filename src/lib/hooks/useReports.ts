'use client';

import { useQuery } from '@tanstack/react-query';

interface PeriodSummary {
  period: string;
  revenue: number;
  profit: number;
  quantity: number;
  salesCount: number;
  platformFee: number;
  paymentFee: number;
  adCost: number;
  operatingCost: number;
  totalCost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  netProfitAfterAd: number;
  netProfitAfterAll: number;
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
  operatingCost?: number;
}

interface ExpenseCategorySummary {
  category: string;
  amount: number;
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
    platformFee: number;
    paymentFee: number;
    adCost: number;
    operatingCost: number;
    totalCost: number;
    impressions: number;
    clicks: number;
    conversions: number;
    netProfitAfterAd: number;
    netProfitAfterAll: number;
    roas: number;
    roi: number;
    marginRate: number;
  };
  periodSummaries: PeriodSummary[];
  channelSummary: ChannelSummary[];
  expenseCategorySummary: ExpenseCategorySummary[];
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

export function getDateRange(preset: string): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  let startDate: string;

  switch (preset) {
    case 'today':
      startDate = endDate;
      break;
    case 'yesterday': {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      startDate = d.toISOString().split('T')[0];
      return { startDate, endDate: startDate };
    }
    case 'week': {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
      break;
    }
    case '2weeks': {
      const d = new Date(today);
      d.setDate(d.getDate() - 14);
      startDate = d.toISOString().split('T')[0];
      break;
    }
    case 'month': {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split('T')[0];
      break;
    }
    case 'quarter': {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 3);
      startDate = d.toISOString().split('T')[0];
      break;
    }
    case 'firstHalf': {
      const year = today.getFullYear();
      startDate = `${year}-01-01`;
      return { startDate, endDate: `${year}-06-30` < endDate ? `${year}-06-30` : endDate };
    }
    case 'secondHalf': {
      const year = today.getFullYear();
      startDate = `${year}-07-01`;
      break;
    }
    case 'year': {
      const d = new Date(today);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split('T')[0];
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
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate, endDate: lastDay.toISOString().split('T')[0] };
    }
    default:
      startDate = endDate;
  }

  return { startDate, endDate };
}
