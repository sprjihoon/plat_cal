import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function GET(_request: NextRequest) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  const { data: profiles } = await (serviceClient as any)
    .from('profiles')
    .select('id, name, email');

  const profileMap = new Map<string, { name: string; email: string }>(
    (profiles || []).map((p: any) => [p.id, p])
  );

  // 유저별 데이터 사용량
  const { data: productCounts } = await (serviceClient as any)
    .from('products')
    .select('user_id');
  const { data: salesCounts } = await (serviceClient as any)
    .from('sales_records')
    .select('user_id');
  const { data: adCounts } = await (serviceClient as any)
    .from('advertising_costs')
    .select('user_id');
  const { data: expenseCounts } = await (serviceClient as any)
    .from('operating_expenses')
    .select('user_id');

  const usageMap = new Map<string, { products: number; sales: number; ads: number; expenses: number }>();

  const increment = (data: any[], field: string) => {
    for (const row of data || []) {
      const uid = row.user_id;
      const existing = usageMap.get(uid) || { products: 0, sales: 0, ads: 0, expenses: 0 };
      (existing as any)[field] += 1;
      usageMap.set(uid, existing);
    }
  };

  increment(productCounts, 'products');
  increment(salesCounts, 'sales');
  increment(adCounts, 'ads');
  increment(expenseCounts, 'expenses');

  // 유저별 세션 수 & 총 체류시간
  const { data: sessionData } = await (serviceClient as any)
    .from('user_sessions')
    .select('user_id, started_at, ended_at');

  const sessionMap = new Map<string, { count: number; totalDuration: number }>();
  for (const s of sessionData || []) {
    const existing = sessionMap.get(s.user_id) || { count: 0, totalDuration: 0 };
    existing.count += 1;
    if (s.started_at && s.ended_at) {
      const dur = (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000;
      if (dur > 0 && dur < 86400) existing.totalDuration += dur;
    }
    sessionMap.set(s.user_id, existing);
  }

  // 유저별 페이지뷰 수
  const { data: pvData } = await (serviceClient as any)
    .from('page_views')
    .select('user_id');

  const pvMap = new Map<string, number>();
  for (const pv of pvData || []) {
    if (pv.user_id) pvMap.set(pv.user_id, (pvMap.get(pv.user_id) || 0) + 1);
  }

  const allUserIds = new Set([
    ...usageMap.keys(),
    ...sessionMap.keys(),
    ...pvMap.keys(),
  ]);

  const userUsage = Array.from(allUserIds).map((uid) => {
    const p = profileMap.get(uid);
    const usage = usageMap.get(uid) || { products: 0, sales: 0, ads: 0, expenses: 0 };
    const session = sessionMap.get(uid) || { count: 0, totalDuration: 0 };
    const pageViews = pvMap.get(uid) || 0;
    const totalRecords = usage.products + usage.sales + usage.ads + usage.expenses;

    return {
      id: uid,
      name: p?.name || null,
      email: p?.email || null,
      ...usage,
      totalRecords,
      sessionCount: session.count,
      totalDuration: Math.round(session.totalDuration),
      pageViews,
    };
  });

  const byRecords = [...userUsage].sort((a, b) => b.totalRecords - a.totalRecords).slice(0, 15);
  const bySessions = [...userUsage].sort((a, b) => b.sessionCount - a.sessionCount).slice(0, 15);
  const byDuration = [...userUsage].sort((a, b) => b.totalDuration - a.totalDuration).slice(0, 15);
  const byPageViews = [...userUsage].sort((a, b) => b.pageViews - a.pageViews).slice(0, 15);

  return NextResponse.json({
    byRecords,
    bySessions,
    byDuration,
    byPageViews,
    totalUsers: allUserIds.size,
  });
}
