import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/validate';

export async function POST(request: NextRequest) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  try {
    const body = await request.json();
    const { session_id, page_path, referrer_path, entered_at } = body;

    if (!session_id || !page_path || !entered_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('page_views')
      .insert({
        user_id: user.id,
        session_id,
        page_path,
        referrer_path: referrer_path || null,
        entered_at,
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
    const { id, left_at, duration_seconds } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing page view id' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('page_views')
      .update({
        left_at,
        duration_seconds,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
