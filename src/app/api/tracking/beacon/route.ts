import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { type, ...payload } = body;

    if (type === 'pageview_end' && payload.id) {
      await (supabase as any)
        .from('page_views')
        .update({
          left_at: payload.left_at,
          duration_seconds: payload.duration_seconds,
        })
        .eq('id', payload.id)
        .eq('user_id', user.id);
    }

    if (type === 'session_end' && payload.session_id) {
      await (supabase as any)
        .from('user_sessions')
        .update({
          exit_page: payload.exit_page,
          page_count: payload.page_count,
          ended_at: payload.ended_at,
        })
        .eq('session_id', payload.session_id)
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
