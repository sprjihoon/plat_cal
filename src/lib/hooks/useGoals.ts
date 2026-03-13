'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Goal, GoalInsert, GoalUpdate } from '@/types/database';

interface GoalsResponse {
  goals: Goal[];
}

async function fetchGoals(current = false): Promise<GoalsResponse> {
  const params = current ? '?current=true' : '';
  const res = await fetch(`/api/goals${params}`);
  if (!res.ok) throw new Error('Failed to fetch goals');
  return res.json();
}

async function createGoal(data: Omit<GoalInsert, 'user_id'>): Promise<Goal> {
  const res = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create goal');
  }
  return res.json();
}

async function updateGoal(id: string, data: GoalUpdate): Promise<Goal> {
  const res = await fetch(`/api/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update goal');
  }
  return res.json();
}

async function deleteGoal(id: string): Promise<void> {
  const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete goal');
  }
}

export function useGoals(current = false) {
  return useQuery({
    queryKey: ['goals', current],
    queryFn: () => fetchGoals(current),
  });
}

export function useCurrentGoal() {
  return useQuery({
    queryKey: ['goals', true],
    queryFn: () => fetchGoals(true),
    select: (data) => data.goals[0] || null,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GoalUpdate }) => updateGoal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
