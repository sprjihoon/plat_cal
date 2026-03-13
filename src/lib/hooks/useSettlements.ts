'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SettlementSchedule, SettlementScheduleInsert, SettlementScheduleUpdate } from '@/types/database';

interface SettlementsResponse {
  settlements: SettlementSchedule[];
}

async function fetchSettlements(month?: string): Promise<SettlementsResponse> {
  const params = month ? `?month=${month}` : '';
  const res = await fetch(`/api/settlements${params}`);
  if (!res.ok) throw new Error('Failed to fetch settlements');
  return res.json();
}

async function createSettlement(data: Omit<SettlementScheduleInsert, 'user_id'>): Promise<SettlementSchedule> {
  const res = await fetch('/api/settlements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create settlement');
  return res.json();
}

async function updateSettlement(id: string, data: SettlementScheduleUpdate): Promise<SettlementSchedule> {
  const res = await fetch(`/api/settlements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update settlement');
  return res.json();
}

async function deleteSettlement(id: string): Promise<void> {
  const res = await fetch(`/api/settlements/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete settlement');
}

export function useSettlements(month?: string) {
  return useQuery({
    queryKey: ['settlements', month],
    queryFn: () => fetchSettlements(month),
  });
}

export function useCreateSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSettlement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settlements'] }),
  });
}

export function useUpdateSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SettlementScheduleUpdate }) => updateSettlement(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settlements'] }),
  });
}

export function useDeleteSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSettlement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settlements'] }),
  });
}
