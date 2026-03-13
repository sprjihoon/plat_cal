import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRateLimit } from '@/lib/api/validate';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  const rateLimited = withRateLimit(user.id, 'goals:put', 20);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();

    const { data, error } = await (supabase as any)
      .from('goals')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const { id } = await params;

  const { error } = await (supabase as any)
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
