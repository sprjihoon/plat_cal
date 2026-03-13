'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@/types/database';

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

async function fetchNotifications(unreadOnly = false): Promise<NotificationsResponse> {
  const params = unreadOnly ? '?unread=true' : '';
  const res = await fetch(`/api/notifications${params}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

async function markRead(id: string): Promise<void> {
  await fetch('/api/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

async function markAllRead(): Promise<void> {
  await fetch('/api/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markAllRead: true }),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(),
    refetchInterval: 60_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => fetchNotifications(true),
    select: (data) => data.unreadCount,
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
