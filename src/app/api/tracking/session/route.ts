import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return '0.0.0.0';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, entry_page, user_agent } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const ip = getClientIP(request);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const serviceClient = await createServiceClient();

    const { data: existing } = await (serviceClient as any)
      .from('user_sessions')
      .select('id')
      .eq('session_id', session_id)
      .single();

    if (existing) {
      return NextResponse.json({ id: existing.id, existing: true });
    }

    const { data, error } = await (serviceClient as any)
      .from('user_sessions')
      .insert({
        user_id: user?.id || null,
        session_id,
        entry_page: entry_page || null,
        user_agent: user_agent || null,
        ip_address: ip,
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

    const serviceClient = await createServiceClient();

    const { error } = await (serviceClient as any)
      .from('user_sessions')
      .update(updateData)
      .eq('session_id', session_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
