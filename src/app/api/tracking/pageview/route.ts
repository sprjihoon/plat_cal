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
    const { session_id, page_path, referrer_path, entered_at } = body;

    if (!session_id || !page_path || !entered_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ip = getClientIP(request);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const serviceClient = await createServiceClient();

    const { data, error } = await (serviceClient as any)
      .from('page_views')
      .insert({
        user_id: user?.id || null,
        session_id,
        page_path,
        referrer_path: referrer_path || null,
        entered_at,
        ip_address: ip,
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
    const { id, left_at, duration_seconds } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing page view id' }, { status: 400 });
    }

    const serviceClient = await createServiceClient();

    const { error } = await (serviceClient as any)
      .from('page_views')
      .update({
        left_at,
        duration_seconds,
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
