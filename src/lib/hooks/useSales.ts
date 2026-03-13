'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SalesRecord, SalesRecordInsert, SalesRecordUpdate } from '@/types/database';

interface SalesResponse {
  sales: (SalesRecord & { products: { name: string; sku: string | null } })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SalesFilters {
  startDate?: string;
  endDate?: string;
  channel?: string;
  productId?: string;
  status?: string;
}

async function fetchSales(
  page = 1,
  limit = 50,
  filters: SalesFilters = {}
): Promise<SalesResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.channel) params.set('channel', filters.channel);
  if (filters.productId) params.set('productId', filters.productId);
  if (filters.status) params.set('status', filters.status);

  const res = await fetch(`/api/sales?${params}`);
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}

async function createSale(data: Omit<SalesRecordInsert, 'user_id'>): Promise<SalesRecord> {
  const res = await fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create sale');
  }
  return res.json();
}

async function updateSale(id: string, data: SalesRecordUpdate): Promise<SalesRecord> {
  const res = await fetch(`/api/sales/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update sale');
  }
  return res.json();
}

async function deleteSale(id: string): Promise<void> {
  const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete sale');
  }
}

export function useSales(page = 1, limit = 50, filters: SalesFilters = {}) {
  return useQuery({
    queryKey: ['sales', page, limit, filters],
    queryFn: () => fetchSales(page, limit, filters),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SalesRecordUpdate }) =>
      updateSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
