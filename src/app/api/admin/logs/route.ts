import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function GET(request: NextRequest) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  const sp = request.nextUrl.searchParams;
  const userId = sp.get('userId');
  const action = sp.get('action');
  const startDate = sp.get('startDate');
  const endDate = sp.get('endDate');
  const page = parseInt(sp.get('page') || '1');
  const limit = parseInt(sp.get('limit') || '50');

  let query = (serviceClient as any)
    .from('user_activity_logs')
    .select('*, profiles!user_activity_logs_user_id_fkey(name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (userId) query = query.eq('user_id', userId);
  if (action) query = query.eq('action', action);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  const { data, count, error } = await query;

  if (error) {
    const { data: fallbackData, count: fallbackCount, error: fallbackError } = await (serviceClient as any)
      .from('user_activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    return NextResponse.json({ logs: fallbackData, total: fallbackCount });
  }

  return NextResponse.json({ logs: data, total: count });
}
