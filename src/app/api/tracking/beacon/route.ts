import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...payload } = body;
    const serviceClient = await createServiceClient();

    if (type === 'pageview_end' && payload.id) {
      await (serviceClient as any)
        .from('page_views')
        .update({
          left_at: payload.left_at,
          duration_seconds: payload.duration_seconds,
        })
        .eq('id', payload.id);
    }

    if (type === 'session_end' && payload.session_id) {
      await (serviceClient as any)
        .from('user_sessions')
        .update({
          exit_page: payload.exit_page,
          page_count: payload.page_count,
          ended_at: payload.ended_at,
        })
        .eq('session_id', payload.session_id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
