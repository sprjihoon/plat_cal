import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function GET(request: NextRequest) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  const sp = request.nextUrl.searchParams;
  const search = sp.get('search') || '';
  const sortBy = sp.get('sortBy') || 'created_at';
  const order = sp.get('order') === 'asc' ? true : false;
  const page = parseInt(sp.get('page') || '1');
  const limit = parseInt(sp.get('limit') || '20');
  const status = sp.get('status');

  const { data: { users: allUsers }, error: listError } =
    await serviceClient.auth.admin.listUsers({ page, perPage: limit });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const userIds = (allUsers || []).map((u) => u.id);

  const { data: profiles } = await (serviceClient as any)
    .from('profiles')
    .select('id, email, name, avatar_url, created_at, plan')
    .in('id', userIds);

  const { data: statuses } = await (serviceClient as any)
    .from('user_status')
    .select('user_id, status, suspended_reason, suspended_at')
    .in('user_id', userIds);

  const statusMap = new Map<string, any>((statuses || []).map((s: any) => [s.user_id, s]));
  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

  const tables = ['sales_records', 'products', 'advertising_costs', 'operating_expenses'];
  const countMaps: Record<string, Map<string, number>> = {};

  for (const table of tables) {
    const { data: rows } = await (serviceClient as any)
      .from(table)
      .select('user_id')
      .in('user_id', userIds);
    const map = new Map<string, number>();
    (rows || []).forEach((r: any) => {
      map.set(r.user_id, (map.get(r.user_id) || 0) + 1);
    });
    countMaps[table] = map;
  }

  let users = (allUsers || []).map((u) => {
    const profile = profileMap.get(u.id);
    const st = statusMap.get(u.id);
    const salesCount = countMaps['sales_records']?.get(u.id) || 0;
    const productCount = countMaps['products']?.get(u.id) || 0;
    const adCount = countMaps['advertising_costs']?.get(u.id) || 0;
    const expenseCount = countMaps['operating_expenses']?.get(u.id) || 0;
    const totalActivity = salesCount + productCount + adCount + expenseCount;

    return {
      id: u.id,
      email: u.email,
      name: profile?.name || null,
      avatar_url: profile?.avatar_url || null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      status: st?.status || 'active',
      suspended_reason: st?.suspended_reason || null,
      suspended_at: st?.suspended_at || null,
      plan: (profile?.plan || 'free') as 'free' | 'pro' | 'plus',
      stats: { salesCount, productCount, adCount, expenseCount, totalActivity },
    };
  });

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'all') {
    users = users.filter((u) => u.status === status);
  }

  if (sortBy === 'activity') {
    users.sort((a, b) => order
      ? a.stats.totalActivity - b.stats.totalActivity
      : b.stats.totalActivity - a.stats.totalActivity);
  } else if (sortBy === 'last_sign_in') {
    users.sort((a, b) => {
      const da = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
      const db = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      return order ? da - db : db - da;
    });
  }

  return NextResponse.json({ users, total: users.length });
}
