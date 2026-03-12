'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OperatingExpense, OperatingExpenseInsert, OperatingExpenseUpdate } from '@/types/database';

interface OperatingExpenseResponse {
  expenses: OperatingExpense[];
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
  category?: string;
}

export const EXPENSE_CATEGORIES = [
  { id: 'packaging', name: '포장비', description: '박스, 테이프, 완충재 등' },
  { id: 'shipping', name: '배송비', description: '택배비, 물류비' },
  { id: 'labor', name: '인건비', description: '직원 급여, 아르바이트' },
  { id: 'warehouse', name: '창고/임대료', description: '창고비, 사무실 임대료' },
  { id: 'utility', name: '공과금', description: '전기, 수도, 인터넷' },
  { id: 'equipment', name: '장비/소모품', description: '컴퓨터, 프린터, 사무용품' },
  { id: 'software', name: '소프트웨어', description: '솔루션, 구독 서비스' },
  { id: 'tax', name: '세금/공과', description: '부가세, 사업자 관련 세금' },
  { id: 'insurance', name: '보험료', description: '사업자 보험' },
  { id: 'other', name: '기타', description: '기타 운영비' },
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]['id'];

async function fetchOperatingExpenses(
  page = 1,
  limit = 50,
  filters: ExpenseFilters = {}
): Promise<OperatingExpenseResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.category) params.set('category', filters.category);

  const res = await fetch(`/api/expenses/operating?${params}`);
  if (!res.ok) throw new Error('Failed to fetch operating expenses');
  return res.json();
}

async function createOperatingExpense(data: Omit<OperatingExpenseInsert, 'user_id'>): Promise<OperatingExpense> {
  const res = await fetch('/api/expenses/operating', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create operating expense');
  }
  return res.json();
}

async function updateOperatingExpense({ id, ...data }: OperatingExpenseUpdate & { id: string }): Promise<OperatingExpense> {
  const res = await fetch(`/api/expenses/operating/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update operating expense');
  }
  return res.json();
}

async function deleteOperatingExpense(id: string): Promise<void> {
  const res = await fetch(`/api/expenses/operating/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete operating expense');
  }
}

export function useOperatingExpenses(page = 1, limit = 50, filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ['operating-expenses', page, limit, filters],
    queryFn: () => fetchOperatingExpenses(page, limit, filters),
  });
}

export function useCreateOperatingExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOperatingExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateOperatingExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOperatingExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteOperatingExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOperatingExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function getCategoryName(categoryId: string): string {
  const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
  return category?.name || categoryId;
}
