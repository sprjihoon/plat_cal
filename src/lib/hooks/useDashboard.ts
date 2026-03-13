'use client';

import { useQuery } from '@tanstack/react-query';

interface DailyStat {
  date: string;
  revenue: number;
  profit: number;
  adCost: number;
  operatingCost: number;
  netProfit: number;
  quantity: number;
}

interface DashboardData {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  summary: {
    revenue: number;
    profit: number;
    quantity: number;
    salesCount: number;
    adCost: number;
    operatingCost: number;
    totalCost: number;
    netProfitAfterAll: number;
    roas: number;
    roi: number;
    marginRate: number;
  };
  changes: {
    revenue: number;
    profit: number;
    totalCost: number;
    netProfitAfterAll: number;
  };
  dailyTrend: DailyStat[];
  channelRevenue: { channel: string; revenue: number }[];
  topProducts: { name: string; revenue: number; profit: number; quantity: number }[];
}

interface DashboardParams {
  period?: string;
  startDate?: string;
  endDate?: string;
}

async function fetchDashboard(params: DashboardParams): Promise<DashboardData> {
  const sp = new URLSearchParams();
  if (params.startDate && params.endDate) {
    sp.set('startDate', params.startDate);
    sp.set('endDate', params.endDate);
  } else if (params.period) {
    sp.set('period', params.period);
  }
  const res = await fetch(`/api/dashboard?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export function useDashboard(params: DashboardParams = { period: 'today' }) {
  return useQuery({
    queryKey: ['dashboard', params],
    queryFn: () => fetchDashboard(params),
  });
}
