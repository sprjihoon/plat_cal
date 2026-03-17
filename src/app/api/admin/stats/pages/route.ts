import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function GET(request: NextRequest) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  const sp = request.nextUrl.searchParams;
  const days = parseInt(sp.get('days') || '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: pageViews } = await (serviceClient as any)
    .from('page_views')
    .select('page_path, duration_seconds, session_id, entered_at')
    .gte('created_at', since);

  const views = pageViews || [];

  // 페이지별 통계
  const pageMap = new Map<string, { views: number; totalDuration: number; sessions: Set<string> }>();
  for (const pv of views) {
    const existing = pageMap.get(pv.page_path) || { views: 0, totalDuration: 0, sessions: new Set<string>() };
    existing.views += 1;
    existing.totalDuration += pv.duration_seconds || 0;
    existing.sessions.add(pv.session_id);
    pageMap.set(pv.page_path, existing);
  }

  const pageStats = Array.from(pageMap.entries())
    .map(([path, stats]) => ({
      path,
      views: stats.views,
      uniqueSessions: stats.sessions.size,
      avgDuration: stats.views > 0 ? Math.round(stats.totalDuration / stats.views) : 0,
    }))
    .sort((a, b) => b.views - a.views);

  // 유입 페이지 (세션의 첫 페이지)
  const { data: sessions } = await (serviceClient as any)
    .from('user_sessions')
    .select('entry_page, exit_page')
    .gte('created_at', since);

  const entryMap = new Map<string, number>();
  const exitMap = new Map<string, number>();
  for (const s of sessions || []) {
    if (s.entry_page) entryMap.set(s.entry_page, (entryMap.get(s.entry_page) || 0) + 1);
    if (s.exit_page) exitMap.set(s.exit_page, (exitMap.get(s.exit_page) || 0) + 1);
  }

  const totalSessions = (sessions || []).length;
  const entryPages = Array.from(entryMap.entries())
    .map(([path, count]) => ({ path, count, rate: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const exitPages = Array.from(exitMap.entries())
    .map(([path, count]) => ({ path, count, rate: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 시간대별 접속 분포
  const hourlyDistribution = new Array(24).fill(0);
  for (const pv of views) {
    const hour = new Date(pv.entered_at).getHours();
    hourlyDistribution[hour] += 1;
  }

  // 일별 페이지뷰 추이
  const dailyViews: { date: string; views: number; uniqueUsers: number }[] = [];
  const dailyMap = new Map<string, { views: number; users: Set<string> }>();
  
  const { data: pageViewsWithUser } = await (serviceClient as any)
    .from('page_views')
    .select('user_id, entered_at')
    .gte('created_at', since);

  for (const pv of pageViewsWithUser || []) {
    const dateStr = new Date(pv.entered_at).toISOString().split('T')[0];
    const existing = dailyMap.get(dateStr) || { views: 0, users: new Set<string>() };
    existing.views += 1;
    if (pv.user_id) existing.users.add(pv.user_id);
    dailyMap.set(dateStr, existing);
  }

  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const stats = dailyMap.get(dateStr);
    dailyViews.push({
      date: dateStr,
      views: stats?.views || 0,
      uniqueUsers: stats?.users.size || 0,
    });
  }

  // 세션 요약
  const { data: allSessions } = await (serviceClient as any)
    .from('user_sessions')
    .select('page_count, started_at, ended_at')
    .gte('created_at', since);

  let totalPageCount = 0;
  let totalSessionDuration = 0;
  let sessionsWithDuration = 0;
  for (const s of allSessions || []) {
    totalPageCount += s.page_count || 0;
    if (s.started_at && s.ended_at) {
      const dur = (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000;
      if (dur > 0 && dur < 86400) {
        totalSessionDuration += dur;
        sessionsWithDuration += 1;
      }
    }
  }

  const sessionCount = (allSessions || []).length;

  return NextResponse.json({
    pageStats: pageStats.slice(0, 20),
    entryPages,
    exitPages,
    hourlyDistribution,
    dailyViews,
    sessionSummary: {
      totalSessions: sessionCount,
      avgPagesPerSession: sessionCount > 0 ? Math.round((totalPageCount / sessionCount) * 10) / 10 : 0,
      avgSessionDuration: sessionsWithDuration > 0 ? Math.round(totalSessionDuration / sessionsWithDuration) : 0,
    },
  });
}
