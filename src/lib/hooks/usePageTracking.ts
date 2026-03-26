'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('_track_sid');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('_track_sid', sid);
  }
  return sid;
}

export function usePageTracking(userId?: string | null) {
  const pathname = usePathname();
  const currentViewId = useRef<string | null>(null);
  const enteredAt = useRef<Date>(new Date());
  const prevPath = useRef<string | null>(null);
  const pageCount = useRef(0);
  const sessionId = useRef('');
  const initialized = useRef(false);

  const closePreviousView = useCallback(async () => {
    if (!currentViewId.current) return;
    const now = new Date();
    const duration = Math.round((now.getTime() - enteredAt.current.getTime()) / 1000);
    try {
      await fetch('/api/tracking/pageview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentViewId.current,
          left_at: now.toISOString(),
          duration_seconds: Math.min(duration, 3600),
        }),
      });
    } catch { /* ignore */ }
    currentViewId.current = null;
  }, []);

  const updateSession = useCallback(async (exitPage: string, ended?: boolean) => {
    if (!sessionId.current) return;
    try {
      await fetch('/api/tracking/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId.current,
          exit_page: exitPage,
          page_count: pageCount.current,
          ...(ended ? { ended_at: new Date().toISOString() } : {}),
        }),
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    sessionId.current = getSessionId();

    if (!initialized.current) {
      initialized.current = true;
      fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId.current,
          entry_page: pathname,
          user_agent: navigator.userAgent,
        }),
      }).catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    if (!sessionId.current) sessionId.current = getSessionId();

    const recordPageView = async () => {
      await closePreviousView();

      pageCount.current += 1;
      enteredAt.current = new Date();

      try {
        const res = await fetch('/api/tracking/pageview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId.current,
            page_path: pathname,
            referrer_path: prevPath.current,
            entered_at: enteredAt.current.toISOString(),
          }),
        });
        const data = await res.json();
        if (data.id) currentViewId.current = data.id;
      } catch { /* ignore */ }

      prevPath.current = pathname;
    };

    recordPageView();
  }, [pathname, closePreviousView]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const now = new Date();
      const duration = Math.round((now.getTime() - enteredAt.current.getTime()) / 1000);

      if (currentViewId.current) {
        navigator.sendBeacon(
          '/api/tracking/beacon',
          new Blob([JSON.stringify({
            type: 'pageview_end',
            id: currentViewId.current,
            left_at: now.toISOString(),
            duration_seconds: Math.min(duration, 3600),
          })], { type: 'application/json' })
        );
      }

      if (sessionId.current) {
        navigator.sendBeacon(
          '/api/tracking/beacon',
          new Blob([JSON.stringify({
            type: 'session_end',
            session_id: sessionId.current,
            exit_page: pathname,
            page_count: pageCount.current,
            ended_at: now.toISOString(),
          })], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pathname, updateSession]);
}
