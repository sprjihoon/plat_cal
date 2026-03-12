'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdvertisingCost, AdvertisingCostInsert, OperatingExpense, OperatingExpenseInsert } from '@/types/database';

interface AdvertisingResponse {
  advertising: AdvertisingCost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  channel?: string;
}

// 광고비 API
async function fetchAdvertising(
  page = 1,
  limit = 50,
  filters: ExpenseFilters = {}
): Promise<AdvertisingResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.channel) params.set('channel', filters.channel);

  const res = await fetch(`/api/expenses/advertising?${params}`);
  if (!res.ok) throw new Error('Failed to fetch advertising');
  return res.json();
}

async function createAdvertising(data: Omit<AdvertisingCostInsert, 'user_id'>): Promise<AdvertisingCost> {
  const res = await fetch('/api/expenses/advertising', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create advertising');
  }
  return res.json();
}

async function updateAdvertising({ id, ...data }: { id: string } & Partial<AdvertisingCostInsert>): Promise<AdvertisingCost> {
  const res = await fetch(`/api/expenses/advertising/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update advertising');
  }
  return res.json();
}

async function deleteAdvertising(id: string): Promise<void> {
  const res = await fetch(`/api/expenses/advertising/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete advertising');
  }
}

export function useAdvertising(page = 1, limit = 50, filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ['advertising', page, limit, filters],
    queryFn: () => fetchAdvertising(page, limit, filters),
  });
}

export function useCreateAdvertising() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdvertising,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertising'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateAdvertising() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdvertising,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertising'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteAdvertising() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdvertising,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertising'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// ROI/ROAS 계산 유틸리티
export function calculateROAS(revenue: number, adCost: number): number {
  if (adCost === 0) return 0;
  return (revenue / adCost) * 100;
}

export function calculateROI(profit: number, adCost: number): number {
  if (adCost === 0) return 0;
  return ((profit - adCost) / adCost) * 100;
}

export function calculateCPC(cost: number, clicks: number): number {
  if (clicks === 0) return 0;
  return cost / clicks;
}

export function calculateCPA(cost: number, conversions: number): number {
  if (conversions === 0) return 0;
  return cost / conversions;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

export function calculateCVR(conversions: number, clicks: number): number {
  if (clicks === 0) return 0;
  return (conversions / clicks) * 100;
}
