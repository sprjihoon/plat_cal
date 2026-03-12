'use client';

import { useQuery } from '@tanstack/react-query';

interface DashboardData {
  summary: {
    totalProducts: number;
    totalMarkets: number;
    totalProfit: number;
    profitableProducts: number;
    unprofitableProducts: number;
    avgProfitPerProduct: number;
  };
  topProfitProducts: {
    id: string;
    name: string;
    profit: number;
    marginRate: number;
  }[];
  lowProfitProducts: {
    id: string;
    name: string;
    profit: number;
    marginRate: number;
  }[];
  marketSummary: {
    channel: string;
    count: number;
    totalProfit: number;
    avgProfit: number;
  }[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });
}
