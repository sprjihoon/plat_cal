import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { withAuth, withRateLimit, validateBody } from '@/lib/api/validate';

const createSettlementSchema = z.object({
  channel: z.string().min(1),
  settlement_cycle: z.string().min(1),
  next_settlement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  expected_amount: z.number().min(0).optional(),
  actual_amount: z.number().nullable().optional(),
  is_confirmed: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const rateLimited = withRateLimit(user.id, 'settlements:get');
  if (rateLimited) return rateLimited;

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get('month');

  let query = (supabase as any)
    .from('settlement_schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('next_settlement_date', { ascending: true });

  if (month) {
    const start = `${month}-01`;
    const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0);
    const end = endDate.toISOString().split('T')[0];
    query = query.gte('next_settlement_date', start).lte('next_settlement_date', end);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settlements: data });
}

export async function POST(request: NextRequest) {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const rateLimited = withRateLimit(user.id, 'settlements:post', 20);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const validation = validateBody(body, createSettlementSchema);
    if (!validation.success) return validation.response;

    const { data, error } = await (supabase as any)
      .from('settlement_schedules')
      .insert({ user_id: user.id, ...validation.data })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
