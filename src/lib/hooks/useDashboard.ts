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

async function fetchDashboard(period: string): Promise<DashboardData> {
  const res = await fetch(`/api/dashboard?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export function useDashboard(period = 'month') {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => fetchDashboard(period),
  });
}
