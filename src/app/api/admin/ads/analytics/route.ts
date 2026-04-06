import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function GET(request: NextRequest) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days') || '30');
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const sb = serviceClient as any;

  const [
    { data: logs },
    { data: banners },
  ] = await Promise.all([
    sb.from('ad_click_logs')
      .select('id, banner_id, event_type, user_id, session_id, page_path, referrer, device_type, ip_hash, ip_address, created_at')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(10000),
    sb.from('ad_banners')
      .select('id, title, highlight, link_url, is_active, impression_count, click_count')
      .order('sort_order', { ascending: true }),
  ]);

  const allLogs: any[] = logs || [];
  const allBanners: any[] = banners || [];

  // 배너별 집계
  const bannerStats = allBanners.map((b: any) => {
    const bannerLogs = allLogs.filter((l: any) => l.banner_id === b.id);
    const impressions = bannerLogs.filter((l: any) => l.event_type === 'impression').length;
    const clicks = bannerLogs.filter((l: any) => l.event_type === 'click').length;
    const uniqueClickers = new Set(bannerLogs.filter((l: any) => l.event_type === 'click').map((l: any) => l.ip_hash)).size;
    const ctr = impressions > 0 ? (clicks / impressions * 100) : 0;

    return {
      id: b.id,
      title: b.title,
      highlight: b.highlight,
      link_url: b.link_url,
      is_active: b.is_active,
      impressions,
      clicks,
      uniqueClickers,
      ctr: Math.round(ctr * 100) / 100,
    };
  });

  // 디바이스별 분포
  const deviceBreakdown: Record<string, { impressions: number; clicks: number }> = {};
  for (const log of allLogs) {
    const device = log.device_type || 'unknown';
    if (!deviceBreakdown[device]) deviceBreakdown[device] = { impressions: 0, clicks: 0 };
    if (log.event_type === 'impression') deviceBreakdown[device].impressions++;
    else deviceBreakdown[device].clicks++;
  }

  // 페이지별 클릭 분포
  const pageBreakdown: Record<string, number> = {};
  for (const log of allLogs.filter((l: any) => l.event_type === 'click')) {
    const page = log.page_path || '(알 수 없음)';
    pageBreakdown[page] = (pageBreakdown[page] || 0) + 1;
  }
  const topPages = Object.entries(pageBreakdown)
    .map(([path, clicks]) => ({ path, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // 리퍼러별 유입
  const referrerBreakdown: Record<string, number> = {};
  for (const log of allLogs.filter((l: any) => l.event_type === 'click')) {
    let ref = log.referrer || '(직접 유입)';
    try {
      if (ref.startsWith('http')) {
        const u = new URL(ref);
        ref = u.hostname + u.pathname;
      }
    } catch { /* keep raw */ }
    referrerBreakdown[ref] = (referrerBreakdown[ref] || 0) + 1;
  }
  const topReferrers = Object.entries(referrerBreakdown)
    .map(([source, clicks]) => ({ source, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // 일별 추이
  const dailyMap: Record<string, { impressions: number; clicks: number }> = {};
  for (const log of allLogs) {
    const date = log.created_at.substring(0, 10);
    if (!dailyMap[date]) dailyMap[date] = { impressions: 0, clicks: 0 };
    if (log.event_type === 'impression') dailyMap[date].impressions++;
    else dailyMap[date].clicks++;
  }
  const dailyTrend = Object.entries(dailyMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 시간대별 분포
  const hourlyClicks = new Array(24).fill(0);
  for (const log of allLogs.filter((l: any) => l.event_type === 'click')) {
    const hour = new Date(log.created_at).getHours();
    hourlyClicks[hour]++;
  }

  // 요약
  const totalImpressions = allLogs.filter((l: any) => l.event_type === 'impression').length;
  const totalClicks = allLogs.filter((l: any) => l.event_type === 'click').length;
  const uniqueUsers = new Set(allLogs.filter((l: any) => l.user_id).map((l: any) => l.user_id)).size;
  const uniqueIPs = new Set(allLogs.map((l: any) => l.ip_hash)).size;

  // 최근 클릭 로그 (누가 / 어디서) — 관리자 전용
  const clickOnly = allLogs.filter((l: any) => l.event_type === 'click');
  const recentClickLogs = [...clickOnly]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 200);

  const clickUserIds = [...new Set(recentClickLogs.map((l: any) => l.user_id).filter(Boolean))] as string[];
  const profileById = new Map<string, { name: string | null; email: string | null }>();
  if (clickUserIds.length > 0) {
    const { data: profiles } = await sb.from('profiles').select('id, name, email').in('id', clickUserIds);
    for (const p of profiles || []) {
      profileById.set(p.id, { name: p.name ?? null, email: p.email ?? null });
    }
  }

  const bannerTitleById = new Map<string, string>(allBanners.map((b: any) => [b.id, b.title]));

  const recentClicks = recentClickLogs.map((l: any) => {
    const prof = l.user_id ? profileById.get(l.user_id) : undefined;
    const ipRaw = typeof l.ip_address === 'string' && l.ip_address.trim() ? l.ip_address.trim() : null;
    return {
      id: l.id,
      createdAt: l.created_at,
      bannerId: l.banner_id,
      bannerTitle: bannerTitleById.get(l.banner_id) || '(알 수 없음)',
      pagePath: l.page_path || '—',
      device: l.device_type || 'unknown',
      ip: ipRaw,
      ipHashShort: !ipRaw && l.ip_hash ? String(l.ip_hash).slice(0, 12) : null,
      userName: prof?.name || null,
      userEmail: prof?.email || null,
      isLoggedIn: !!l.user_id,
    };
  });

  return NextResponse.json({
    summary: {
      totalImpressions,
      totalClicks,
      overallCTR: totalImpressions > 0 ? Math.round(totalClicks / totalImpressions * 10000) / 100 : 0,
      uniqueUsers,
      uniqueIPs,
      period: days,
    },
    bannerStats,
    deviceBreakdown: Object.entries(deviceBreakdown).map(([device, data]) => ({ device, ...data })),
    topPages,
    topReferrers,
    dailyTrend,
    hourlyClicks,
    recentClicks,
  });
}
