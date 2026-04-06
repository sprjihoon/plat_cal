import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

/** yyyy-mm-dd in Asia/Seoul for an ISO timestamp */
function toKstYmd(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function kstTodayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function bucketSessionCountsPerKey(counts: Iterable<number>): { visits: number; visitors: number }[] {
  const m = new Map<number, number>();
  for (const c of counts) {
    m.set(c, (m.get(c) || 0) + 1);
  }
  return Array.from(m.entries())
    .map(([visits, visitors]) => ({ visits, visitors }))
    .sort((a, b) => a.visits - b.visits);
}

export async function GET(request: NextRequest) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  const sp = request.nextUrl.searchParams;
  const days = parseInt(sp.get('days') || '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [sessionsRes, pageViewsRes] = await Promise.all([
    (serviceClient as any)
      .from('user_sessions')
      .select('id, user_id, session_id, started_at, ended_at, entry_page, exit_page, page_count, user_agent, ip_address, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(2000),
    (serviceClient as any)
      .from('page_views')
      .select('id, user_id, session_id, page_path, duration_seconds, ip_address, entered_at, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000),
  ]);

  const sessions = sessionsRes.data || [];
  const pageViews = pageViewsRes.data || [];

  // --- 실시간 방문자 (최근 5분 이내 활동) ---
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const recentViews = pageViews.filter((pv: any) => pv.entered_at >= fiveMinAgo);
  const realtimeIPs = new Set(recentViews.map((pv: any) => pv.ip_address).filter(Boolean));
  const realtimeSessions = new Set(recentViews.map((pv: any) => pv.session_id));
  const realtimePages: Record<string, number> = {};
  for (const pv of recentViews) {
    realtimePages[pv.page_path] = (realtimePages[pv.page_path] || 0) + 1;
  }
  const realtimeTopPages = Object.entries(realtimePages)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // --- IP별 방문 통계 ---
  const ipMap = new Map<string, {
    visits: number; pageViews: number; totalDuration: number;
    lastSeen: string; pages: Set<string>; userAgents: Set<string>;
    userId: string | null; sessions: Set<string>;
  }>();

  for (const s of sessions) {
    const ip = s.ip_address || 'unknown';
    const existing = ipMap.get(ip) || {
      visits: 0, pageViews: 0, totalDuration: 0,
      lastSeen: '', pages: new Set(), userAgents: new Set(),
      userId: null, sessions: new Set(),
    };
    existing.visits += 1;
    existing.sessions.add(s.session_id);
    if (s.user_id) existing.userId = s.user_id;
    if (s.user_agent) existing.userAgents.add(s.user_agent);
    if (s.entry_page) existing.pages.add(s.entry_page);
    if (!existing.lastSeen || s.created_at > existing.lastSeen) {
      existing.lastSeen = s.created_at;
    }
    if (s.started_at && s.ended_at) {
      const dur = (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000;
      if (dur > 0 && dur < 86400) existing.totalDuration += dur;
    }
    ipMap.set(ip, existing);
  }

  for (const pv of pageViews) {
    const ip = pv.ip_address || 'unknown';
    const existing = ipMap.get(ip);
    if (existing) {
      existing.pageViews += 1;
      if (pv.duration_seconds) existing.totalDuration += pv.duration_seconds;
      existing.pages.add(pv.page_path);
    }
  }

  const ipStats = Array.from(ipMap.entries())
    .map(([ip, stats]) => ({
      ip,
      visits: stats.visits,
      pageViews: stats.pageViews,
      avgDuration: stats.visits > 0 ? Math.round(stats.totalDuration / stats.visits) : 0,
      totalDuration: Math.round(stats.totalDuration),
      uniquePages: stats.pages.size,
      lastSeen: stats.lastSeen,
      isLoggedIn: !!stats.userId,
      device: detectDevice(Array.from(stats.userAgents)[0] || ''),
    }))
    .sort((a, b) => b.visits - a.visits);

  // --- 일별 방문자 추이 ---
  const dailyMap = new Map<string, { totalVisitors: number; uniqueIPs: Set<string>; loggedIn: Set<string>; anonymous: Set<string>; totalPageViews: number; totalDuration: number }>();

  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap.set(dateStr, { totalVisitors: 0, uniqueIPs: new Set(), loggedIn: new Set(), anonymous: new Set(), totalPageViews: 0, totalDuration: 0 });
  }

  for (const s of sessions) {
    const dateStr = new Date(s.created_at).toISOString().split('T')[0];
    const day = dailyMap.get(dateStr);
    if (!day) continue;
    day.totalVisitors += 1;
    if (s.ip_address) day.uniqueIPs.add(s.ip_address);
    if (s.user_id) day.loggedIn.add(s.user_id);
    else if (s.ip_address) day.anonymous.add(s.ip_address);
  }

  for (const pv of pageViews) {
    const dateStr = new Date(pv.entered_at).toISOString().split('T')[0];
    const day = dailyMap.get(dateStr);
    if (!day) continue;
    day.totalPageViews += 1;
    if (pv.duration_seconds) day.totalDuration += pv.duration_seconds;
  }

  const dailyTrend = Array.from(dailyMap.entries()).map(([date, stats]) => ({
    date,
    sessions: stats.totalVisitors,
    uniqueIPs: stats.uniqueIPs.size,
    loggedIn: stats.loggedIn.size,
    anonymous: stats.anonymous.size,
    pageViews: stats.totalPageViews,
    avgDuration: stats.totalPageViews > 0 ? Math.round(stats.totalDuration / stats.totalPageViews) : 0,
  }));

  // --- 시간대별 분포 ---
  const hourlyVisitors = new Array(24).fill(0);
  for (const s of sessions) {
    const hour = new Date(s.created_at).getHours();
    hourlyVisitors[hour] += 1;
  }

  // --- 디바이스별 분류 ---
  const deviceMap: Record<string, number> = {};
  for (const s of sessions) {
    const dev = detectDevice(s.user_agent || '');
    deviceMap[dev] = (deviceMap[dev] || 0) + 1;
  }

  const deviceBreakdown = Object.entries(deviceMap)
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  // --- 전체 요약 ---
  const allIPs = new Set(sessions.map((s: any) => s.ip_address).filter(Boolean));
  const loggedInSessions = sessions.filter((s: any) => s.user_id).length;
  const anonSessions = sessions.length - loggedInSessions;
  const totalDuration = pageViews.reduce((acc: number, pv: any) => acc + (pv.duration_seconds || 0), 0);
  const avgSessionDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;

  // --- 최근 방문자 목록 (최근 50건) ---
  const recentSessions = sessions.slice(0, 50).map((s: any) => {
    const sessionPVs = pageViews.filter((pv: any) => pv.session_id === s.session_id);
    const duration = s.started_at && s.ended_at
      ? Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000)
      : sessionPVs.reduce((acc: number, pv: any) => acc + (pv.duration_seconds || 0), 0);

    return {
      sessionId: s.session_id,
      ip: s.ip_address || 'unknown',
      isLoggedIn: !!s.user_id,
      entryPage: s.entry_page,
      exitPage: s.exit_page,
      pageCount: s.page_count || sessionPVs.length,
      duration,
      device: detectDevice(s.user_agent || ''),
      startedAt: s.started_at || s.created_at,
      pages: sessionPVs.map((pv: any) => ({
        path: pv.page_path,
        duration: pv.duration_seconds || 0,
      })),
    };
  });

  // --- 인기 페이지 (체류시간 기준) ---
  const pageDurationMap = new Map<string, { views: number; totalDuration: number; uniqueIPs: Set<string> }>();
  for (const pv of pageViews) {
    const existing = pageDurationMap.get(pv.page_path) || { views: 0, totalDuration: 0, uniqueIPs: new Set() };
    existing.views += 1;
    existing.totalDuration += pv.duration_seconds || 0;
    if (pv.ip_address) existing.uniqueIPs.add(pv.ip_address);
    pageDurationMap.set(pv.page_path, existing);
  }

  const pagesByDuration = Array.from(pageDurationMap.entries())
    .map(([path, stats]) => ({
      path,
      views: stats.views,
      avgDuration: stats.views > 0 ? Math.round(stats.totalDuration / stats.views) : 0,
      totalDuration: Math.round(stats.totalDuration),
      uniqueVisitors: stats.uniqueIPs.size,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 20);

  // --- 오늘 (KST) 요약 · 오늘 기준 IP당 세션 수(반복 유입) ---
  const todayYmd = kstTodayYmd();
  const todaySessionsList = sessions.filter((s: any) => toKstYmd(s.created_at) === todayYmd);
  const todayPageViewsList = pageViews.filter((pv: any) => {
    const t = pv.entered_at || pv.created_at;
    return t && toKstYmd(t) === todayYmd;
  });
  const todayUniqueIPs = new Set(
    todaySessionsList.map((s: any) => s.ip_address).filter(Boolean),
  );
  const todayIpSessionCounts = new Map<string, number>();
  for (const s of todaySessionsList) {
    const ip = s.ip_address || 'unknown';
    todayIpSessionCounts.set(ip, (todayIpSessionCounts.get(ip) || 0) + 1);
  }
  const todayRepeatByVisit = bucketSessionCountsPerKey(todayIpSessionCounts.values());

  // --- 선택 기간 내 IP당 누적 세션 수 (반복 유입 분포) ---
  const periodRepeatByVisit = bucketSessionCountsPerKey(
    Array.from(ipMap.values()).map((st) => st.visits),
  );

  return NextResponse.json({
    summary: {
      totalSessions: sessions.length,
      uniqueIPs: allIPs.size,
      loggedInSessions,
      anonymousSessions: anonSessions,
      totalPageViews: pageViews.length,
      avgSessionDuration,
      avgPagesPerSession: sessions.length > 0 ? Math.round((pageViews.length / sessions.length) * 10) / 10 : 0,
      period: days,
    },
    realtime: {
      activeVisitors: realtimeIPs.size,
      activeSessions: realtimeSessions.size,
      topPages: realtimeTopPages,
    },
    ipStats: ipStats.slice(0, 100),
    dailyTrend,
    hourlyVisitors,
    deviceBreakdown,
    recentSessions,
    pagesByDuration,
    today: {
      date: todayYmd,
      uniqueVisitors: todayUniqueIPs.size,
      sessions: todaySessionsList.length,
      pageViews: todayPageViewsList.length,
      repeatByVisit: todayRepeatByVisit,
    },
    periodRepeatByVisit,
  });
}

function detectDevice(ua: string): string {
  if (!ua) return 'unknown';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  if (/bot|crawler|spider/i.test(ua)) return 'bot';
  return 'desktop';
}
