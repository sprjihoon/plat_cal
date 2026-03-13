'use client';

import { useQuery } from '@tanstack/react-query';

export interface ProductAnalyticsItem {
  id: string;
  name: string;
  sku: string | null;
  baseCost: number;
  stockQuantity: number;
  lowStockThreshold: number;
  revenue: number;
  profit: number;
  quantity: number;
  salesCount: number;
  platformFees: number;
  returnCount: number;
  marginRate: number;
  avgPrice: number;
  revenueShare: number;
  channels: string[];
  abcGrade: 'A' | 'B' | 'C';
  cumulativeShare: number;
}

interface ProductAnalyticsData {
  period: { startDate: string; endDate: string };
  totalRevenue: number;
  totalProfit: number;
  totalQuantity: number;
  products: ProductAnalyticsItem[];
}

async function fetchProductAnalytics(startDate: string, endDate: string): Promise<ProductAnalyticsData> {
  const params = new URLSearchParams({ startDate, endDate });
  const res = await fetch(`/api/products/analytics?${params}`);
  if (!res.ok) throw new Error('Failed to fetch product analytics');
  return res.json();
}

export function useProductAnalytics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['productAnalytics', startDate, endDate],
    queryFn: () => fetchProductAnalytics(startDate, endDate),
  });
}
