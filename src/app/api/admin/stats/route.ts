import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function GET(_request: NextRequest) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  const { data: { users: allUsers } } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
  const users = allUsers || [];
  const totalUsers = users.length;

  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);

  const activeIn7d = users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) >= sevenDaysAgo).length;
  const activeIn30d = users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) >= thirtyDaysAgo).length;
  const newIn7d = users.filter(u => new Date(u.created_at) >= sevenDaysAgo).length;
  const newIn30d = users.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length;

  // 이탈 유저: 가입 후 7일 이상 미접속 또는 한번도 접속 안 한 유저
  const churnedUsers = users.filter(u => {
    if (!u.last_sign_in_at) return true;
    return new Date(u.last_sign_in_at) < sevenDaysAgo;
  });
  const churnRate = totalUsers > 0 ? Math.round((churnedUsers.length / totalUsers) * 100) : 0;

  const { count: totalSales } = await (serviceClient as any)
    .from('sales_records').select('*', { count: 'exact', head: true });
  const { count: totalProducts } = await (serviceClient as any)
    .from('products').select('*', { count: 'exact', head: true });

  // 일별 유입/활성 추이 (최근 30일)
  const dailyTrend: { date: string; signups: number; active: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayEnd = new Date(dayStart.getTime() + DAY);
    const dateStr = dayStart.toISOString().split('T')[0];

    const signups = users.filter(u => {
      const d = new Date(u.created_at);
      return d >= dayStart && d < dayEnd;
    }).length;

    const active = users.filter(u => {
      if (!u.last_sign_in_at) return false;
      const d = new Date(u.last_sign_in_at);
      return d >= dayStart && d < dayEnd;
    }).length;

    dailyTrend.push({ date: dateStr, signups, active });
  }

  // 코호트 분석: 주별 가입 → 1주/2주/3주/4주 후 유지율
  const cohortWeeks: {
    week: string;
    signups: number;
    retention: { week: number; retained: number; rate: number }[];
  }[] = [];

  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * DAY);
    const weekEnd = new Date(now.getTime() - i * 7 * DAY);
    const weekUsers = users.filter(u => {
      const d = new Date(u.created_at);
      return d >= weekStart && d < weekEnd;
    });

    const retention: { week: number; retained: number; rate: number }[] = [];
    for (let w = 1; w <= 4; w++) {
      const checkStart = new Date(weekStart.getTime() + w * 7 * DAY);
      if (checkStart > now) break;

      const retained = weekUsers.filter(u => {
        if (!u.last_sign_in_at) return false;
        return new Date(u.last_sign_in_at) >= checkStart;
      }).length;

      retention.push({
        week: w,
        retained,
        rate: weekUsers.length > 0 ? Math.round((retained / weekUsers.length) * 100) : 0,
      });
    }

    cohortWeeks.push({
      week: weekStart.toISOString().split('T')[0],
      signups: weekUsers.length,
      retention,
    });
  }

  // 유저별 활동량 순위
  const { data: salesByUser } = await (serviceClient as any)
    .from('sales_records').select('user_id');

  const activityMap = new Map<string, number>();
  (salesByUser || []).forEach((r: any) => {
    activityMap.set(r.user_id, (activityMap.get(r.user_id) || 0) + 1);
  });

  const { data: profiles } = await (serviceClient as any)
    .from('profiles').select('id, name, email, plan');
  const profileMap = new Map<string, { name: string; email: string; plan: string }>(
    (profiles || []).map((p: any) => [p.id, p])
  );

  // 플랜별 유저 수
  const planCounts = { free: 0, pro: 0, plus: 0 };
  (profiles || []).forEach((p: any) => {
    const plan = p.plan as 'free' | 'pro' | 'plus';
    if (plan in planCounts) planCounts[plan]++;
    else planCounts.free++;
  });

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

  const usersWithNoActivity = users
    .filter(u => !activityMap.has(u.id))
    .map(u => {
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
      churnedCount: churnedUsers.length,
      churnRate,
      totalSales: totalSales || 0,
      totalProducts: totalProducts || 0,
      planCounts,
    },
    dailyTrend,
    cohort: cohortWeeks.reverse(),
    topUsers,
    leastActiveUsers,
    inactiveUsers: usersWithNoActivity.slice(0, 10),
  });
}
