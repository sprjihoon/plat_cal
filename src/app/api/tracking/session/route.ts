import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/validate';

export async function POST(request: NextRequest) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  try {
    const body = await request.json();
    const { session_id, entry_page, user_agent } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const { data: existing } = await (supabase as any)
      .from('user_sessions')
      .select('id')
      .eq('session_id', session_id)
      .single();

    if (existing) {
      return NextResponse.json({ id: existing.id, existing: true });
    }

    const { data, error } = await (supabase as any)
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_id,
        entry_page: entry_page || null,
        user_agent: user_agent || null,
        page_count: 1,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  try {
    const body = await request.json();
    const { session_id, exit_page, page_count, ended_at } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (exit_page) updateData.exit_page = exit_page;
    if (page_count !== undefined) updateData.page_count = page_count;
    if (ended_at) updateData.ended_at = ended_at;

    const { error } = await (supabase as any)
      .from('user_sessions')
      .update(updateData)
      .eq('session_id', session_id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
