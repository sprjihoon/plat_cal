'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePageTracking } from '@/lib/hooks/usePageTracking';

export function PageTracker() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  usePageTracking(userId);

  return null;
}
