import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function GET() {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 전체 / 오늘 / 7일 총 횟수
  const [{ count: totalCount }, { count: todayCount }, { count: weekCount }] = await Promise.all([
    (serviceClient as any).from('calc_logs').select('*', { count: 'exact', head: true }),
    (serviceClient as any).from('calc_logs').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    (serviceClient as any).from('calc_logs').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
  ]);

  // 오늘 모드별 횟수
  const { data: todayLogs } = await (serviceClient as any)
    .from('calc_logs')
    .select('mode, is_auth')
    .gte('created_at', todayStart.toISOString());

  const todayByMode = { profit: 0, price: 0, cost: 0, unknown: 0 };
  let todayAuth = 0;
  let todayGuest = 0;
  (todayLogs || []).forEach((r: { mode: string | null; is_auth: boolean }) => {
    const m = r.mode as keyof typeof todayByMode;
    if (m && m in todayByMode) todayByMode[m]++;
    else todayByMode.unknown++;
    if (r.is_auth) todayAuth++; else todayGuest++;
  });

  // 30일 로그인/비로그인
  const { data: logs30 } = await (serviceClient as any)
    .from('calc_logs')
    .select('created_at, mode, is_auth')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  // 30일 모드별 전체
  const totalByMode = { profit: 0, price: 0, cost: 0, unknown: 0 };
  let authCount30d = 0;
  let guestCount30d = 0;
  (logs30 || []).forEach((r: { mode: string | null; is_auth: boolean }) => {
    const m = r.mode as keyof typeof totalByMode;
    if (m && m in totalByMode) totalByMode[m]++;
    else totalByMode.unknown++;
    if (r.is_auth) authCount30d++; else guestCount30d++;
  });

  // 일별 추이 (최근 30일)
  const dailyMap = new Map<string, { total: number; auth: number; guest: number; profit: number; price: number; cost: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyMap.set(key, { total: 0, auth: 0, guest: 0, profit: 0, price: 0, cost: 0 });
  }
  (logs30 || []).forEach((r: { created_at: string; mode: string | null; is_auth: boolean }) => {
    const key = r.created_at.split('T')[0];
    if (dailyMap.has(key)) {
      const e = dailyMap.get(key)!;
      e.total++;
      if (r.is_auth) e.auth++; else e.guest++;
      if (r.mode === 'profit') e.profit++;
      else if (r.mode === 'price') e.price++;
      else if (r.mode === 'cost') e.cost++;
    }
  });

  return NextResponse.json({
    totalCount: totalCount ?? 0,
    todayCount: todayCount ?? 0,
    weekCount: weekCount ?? 0,
    todayByMode,
    todayAuth,
    todayGuest,
    totalByMode30d: totalByMode,
    authCount30d,
    guestCount30d,
    dailyTrend: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })),
  });
}
