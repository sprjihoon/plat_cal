import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { withAuth, withRateLimit, validateBody } from '@/lib/api/validate';

const createGoalSchema = z.object({
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  target_revenue: z.number().min(0).optional(),
  target_margin_rate: z.number().min(0).max(100).optional(),
  target_roas: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const rateLimited = withRateLimit(user.id, 'goals:get');
  if (rateLimited) return rateLimited;

  const searchParams = request.nextUrl.searchParams;
  const current = searchParams.get('current');

  let query = (supabase as any)
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('period_start', { ascending: false });

  if (current === 'true') {
    const today = new Date().toISOString().split('T')[0];
    query = query.lte('period_start', today).gte('period_end', today);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goals: data });
}

export async function POST(request: NextRequest) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const rateLimited = withRateLimit(user.id, 'goals:post', 10);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const validation = validateBody(body, createGoalSchema);
    if (!validation.success) return validation.response;

    const insertData = {
      user_id: user.id,
      period_start: validation.data.period_start,
      period_end: validation.data.period_end,
      target_revenue: validation.data.target_revenue ?? 0,
      target_margin_rate: validation.data.target_margin_rate ?? 0,
      target_roas: validation.data.target_roas ?? 0,
      notes: validation.data.notes ?? null,
    };

    const { data, error } = await (supabase as any)
      .from('goals')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Goals insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Goals POST error:', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
