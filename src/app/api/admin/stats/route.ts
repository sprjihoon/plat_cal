import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function GET(_request: NextRequest) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  const { data: { users: allUsers } } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
  const totalUsers = allUsers?.length || 0;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const activeIn7d = (allUsers || []).filter(
    (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= new Date(sevenDaysAgo)
  ).length;

  const activeIn30d = (allUsers || []).filter(
    (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= new Date(thirtyDaysAgo)
  ).length;

  const newIn7d = (allUsers || []).filter(
    (u) => new Date(u.created_at) >= new Date(sevenDaysAgo)
  ).length;

  const newIn30d = (allUsers || []).filter(
    (u) => new Date(u.created_at) >= new Date(thirtyDaysAgo)
  ).length;

  const { count: totalSales } = await (serviceClient as any)
    .from('sales_records')
    .select('*', { count: 'exact', head: true });

  const { count: totalProducts } = await (serviceClient as any)
    .from('products')
    .select('*', { count: 'exact', head: true });

  // 코호트: 주별 가입자 → 7일 내 재방문율
  const cohortWeeks: { week: string; signups: number; retained: number; rate: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

    const weekUsers = (allUsers || []).filter((u) => {
      const d = new Date(u.created_at);
      return d >= weekStart && d < weekEnd;
    });

    const retained = weekUsers.filter((u) => {
      if (!u.last_sign_in_at) return false;
      const lastSign = new Date(u.last_sign_in_at);
      const created = new Date(u.created_at);
      return lastSign.getTime() - created.getTime() > 24 * 60 * 60 * 1000;
    }).length;

    cohortWeeks.push({
      week: weekStart.toISOString().split('T')[0],
      signups: weekUsers.length,
      retained,
      rate: weekUsers.length > 0 ? Math.round((retained / weekUsers.length) * 100) : 0,
    });
  }

  // 유저별 활동량 순위
  const { data: salesByUser } = await (serviceClient as any)
    .from('sales_records')
    .select('user_id');

  const activityMap = new Map<string, number>();
  (salesByUser || []).forEach((r: any) => {
    activityMap.set(r.user_id, (activityMap.get(r.user_id) || 0) + 1);
  });

  const { data: profiles } = await (serviceClient as any)
    .from('profiles')
    .select('id, name, email');
  const profileMap = new Map<string, { name: string; email: string }>((profiles || []).map((p: any) => [p.id, p]));

  const topUsers = Array.from(activityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([uid, count]) => {
      const p = profileMap.get(uid);
      return { id: uid, name: p?.name, email: p?.email, salesCount: count };
    });

  const leastActiveUsers = Array.from(activityMap.entries())
    .sort((a, b) => a[1] - b[1])
    .slice(0, 10)
    .map(([uid, count]) => {
      const p = profileMap.get(uid);
      return { id: uid, name: p?.name, email: p?.email, salesCount: count };
    });

  // 활동 없는 유저
  const usersWithNoActivity = (allUsers || [])
    .filter((u) => !activityMap.has(u.id))
    .map((u) => {
      const p = profileMap.get(u.id);
      return { id: u.id, name: p?.name, email: u.email, salesCount: 0 };
    });

  return NextResponse.json({
    overview: {
      totalUsers,
      activeIn7d,
      activeIn30d,
      newIn7d,
      newIn30d,
      totalSales: totalSales || 0,
      totalProducts: totalProducts || 0,
    },
    cohort: cohortWeeks.reverse(),
    topUsers,
    leastActiveUsers,
    inactiveUsers: usersWithNoActivity.slice(0, 10),
  });
}
