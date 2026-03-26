'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Users, Bell, Megaphone, BarChart3, Loader2, Shield, Search,
  Trash2, Pause, Play, RotateCcw, Send, Plus, TrendingUp,
  TrendingDown, Activity, UserCheck, UserX, Eye, Globe, Database,
  Clock, ArrowRightLeft, LogIn, LogOut, Monitor, Image, ExternalLink,
  GripVertical, Pencil, ChevronUp, ChevronDown, MousePointerClick,
  Smartphone, TabletSmartphone, MonitorSmartphone, Wifi, MapPin,
  UserRound, Ghost, Timer, Radio,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  status: string;
  suspended_reason: string | null;
  stats: { salesCount: number; productCount: number; adCount: number; expenseCount: number; totalActivity: number };
}

interface StatsData {
  overview: {
    totalUsers: number;
    activeIn7d: number;
    activeIn30d: number;
    newIn7d: number;
    newIn30d: number;
    churnedCount: number;
    churnRate: number;
    totalSales: number;
    totalProducts: number;
  };
  dailyTrend: { date: string; signups: number; active: number }[];
  cohort: { week: string; signups: number; retention: { week: number; retained: number; rate: number }[] }[];
  topUsers: { id: string; name: string; email: string; salesCount: number }[];
  leastActiveUsers: { id: string; name: string; email: string; salesCount: number }[];
  inactiveUsers: { id: string; name: string; email: string; salesCount: number }[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

interface LogEntry {
  id: string;
  user_id: string;
  action: string;
  resource: string | null;
  metadata: any;
  created_at: string;
  profiles?: { name: string; email: string };
}

interface AdBannerData {
  id: string;
  title: string;
  subtitle: string | null;
  highlight: string | null;
  link_url: string | null;
  image_url: string | null;
  bg_color: string;
  text_color: string;
  highlight_color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface PageStatsData {
  pageStats: { path: string; views: number; uniqueSessions: number; avgDuration: number }[];
  entryPages: { path: string; count: number; rate: number }[];
  exitPages: { path: string; count: number; rate: number }[];
  hourlyDistribution: number[];
  dailyViews: { date: string; views: number; uniqueUsers: number }[];
  sessionSummary: { totalSessions: number; avgPagesPerSession: number; avgSessionDuration: number };
}

interface UsageData {
  byRecords: UserUsageRow[];
  bySessions: UserUsageRow[];
  byDuration: UserUsageRow[];
  byPageViews: UserUsageRow[];
  totalUsers: number;
}

interface UserUsageRow {
  id: string;
  name: string | null;
  email: string | null;
  products: number;
  sales: number;
  ads: number;
  expenses: number;
  totalRecords: number;
  sessionCount: number;
  totalDuration: number;
  pageViews: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const { data } = await supabase.from('admin_users').select('id').eq('user_id', user.id).single();
      if (!data) { router.push('/dashboard'); return; }
      setIsAdmin(true);
      setAuthChecked(true);
    };
    check();
  }, [router]);

  if (!authChecked || !isAdmin) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">관리자 대시보드</h1>
            <p className="text-muted-foreground text-sm">유저 관리, 공지, 알림, 활동 분석</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v || 'dashboard')}>
          <TabsList className="grid w-full grid-cols-5 sm:grid-cols-9">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">통계</span>
            </TabsTrigger>
            <TabsTrigger value="visitors" className="flex items-center gap-1.5">
              <Wifi className="h-4 w-4" /><span className="hidden sm:inline">방문자</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" /><span className="hidden sm:inline">페이지</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-1.5">
              <Database className="h-4 w-4" /><span className="hidden sm:inline">사용량</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /><span className="hidden sm:inline">유저</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-1.5">
              <Megaphone className="h-4 w-4" /><span className="hidden sm:inline">공지</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-1.5">
              <Image className="h-4 w-4" /><span className="hidden sm:inline">광고</span>
            </TabsTrigger>
            <TabsTrigger value="ad-analytics" className="flex items-center gap-1.5">
              <MousePointerClick className="h-4 w-4" /><span className="hidden sm:inline">광고성과</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" /><span className="hidden sm:inline">로그</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="visitors"><VisitorsTab /></TabsContent>
          <TabsContent value="pages"><PagesTab /></TabsContent>
          <TabsContent value="usage"><UsageTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
          <TabsContent value="ads"><AdsTab /></TabsContent>
          <TabsContent value="ad-analytics"><AdAnalyticsTab /></TabsContent>
          <TabsContent value="logs"><LogsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}시간 ${m}분`;
}

function PagesTab() {
  const [data, setData] = useState<PageStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stats/pages?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-muted-foreground text-center py-8">데이터를 불러올 수 없습니다</p>;

  const hourMax = Math.max(...data.hourlyDistribution, 1);
  const dailyMax = Math.max(...data.dailyViews.map(d => d.views), 1);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Globe className="h-5 w-5" />페이지 분석</h2>
        <Select value={days} onValueChange={(v) => setDays(v || '30')}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">최근 7일</SelectItem>
            <SelectItem value="14">최근 14일</SelectItem>
            <SelectItem value="30">최근 30일</SelectItem>
            <SelectItem value="90">최근 90일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 세션 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon={Monitor} label="총 세션" value={data.sessionSummary.totalSessions} />
        <StatCard icon={ArrowRightLeft} label="세션당 페이지" value={data.sessionSummary.avgPagesPerSession} sub="평균" />
        <StatCard icon={Clock} label="평균 세션 시간" value={0} sub={formatDuration(data.sessionSummary.avgSessionDuration)} />
      </div>

      {/* 일별 페이지뷰 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">일별 페이지뷰 추이</CardTitle>
          <CardDescription>
            <span className="inline-flex items-center gap-1.5 mr-4"><span className="w-3 h-3 rounded-sm bg-[#8C9EFF]" /> 페이지뷰</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#D6F74C]" /> 순 방문자</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[2px] h-[140px]">
            {data.dailyViews.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-[1px] h-full justify-end group relative">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border rounded-md px-2 py-1 text-xs shadow-md whitespace-nowrap z-10">
                  <p className="font-medium">{d.date}</p>
                  <p>PV {d.views} · UV {d.uniqueUsers}</p>
                </div>
                <div
                  className="w-full bg-[#8C9EFF] rounded-t-sm min-h-[1px]"
                  style={{ height: `${(d.views / dailyMax) * 100}%` }}
                />
                <div
                  className="w-full bg-[#D6F74C] rounded-t-sm min-h-[1px]"
                  style={{ height: `${(d.uniqueUsers / dailyMax) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{data.dailyViews[0]?.date}</span>
            <span className="text-[10px] text-muted-foreground">{data.dailyViews[data.dailyViews.length - 1]?.date}</span>
          </div>
        </CardContent>
      </Card>

      {/* 페이지별 통계 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">페이지별 통계</CardTitle>
          <CardDescription>방문 수 기준 상위 페이지</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>페이지</TableHead>
                <TableHead className="text-right">방문수</TableHead>
                <TableHead className="text-right hidden sm:table-cell">고유 세션</TableHead>
                <TableHead className="text-right">평균 체류</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pageStats.map((p) => (
                <TableRow key={p.path}>
                  <TableCell className="font-mono text-sm">{p.path}</TableCell>
                  <TableCell className="text-right">{p.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{p.uniqueSessions.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatDuration(p.avgDuration)}</TableCell>
                </TableRow>
              ))}
              {data.pageStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    아직 페이지뷰 데이터가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 유입 페이지 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><LogIn className="h-4 w-4 text-green-600" />유입 페이지 TOP</CardTitle>
            <CardDescription>유저가 처음 접속한 페이지</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.entryPages.map((p, i) => (
                <div key={p.path} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <span className="font-mono">{p.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{p.count}회</span>
                    <Badge variant="secondary">{p.rate}%</Badge>
                  </div>
                </div>
              ))}
              {data.entryPages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 이탈 페이지 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><LogOut className="h-4 w-4 text-red-500" />이탈 페이지 TOP</CardTitle>
            <CardDescription>유저가 마지막으로 본 페이지</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.exitPages.map((p, i) => (
                <div key={p.path} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-muted text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <span className="font-mono">{p.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{p.count}회</span>
                    <Badge variant="secondary">{p.rate}%</Badge>
                  </div>
                </div>
              ))}
              {data.exitPages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 시간대별 접속 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />시간대별 접속 분포</CardTitle>
          <CardDescription>하루 중 어느 시간에 접속이 많은지</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-[120px]">
            {data.hourlyDistribution.map((count, hour) => (
              <div key={hour} className="flex-1 flex flex-col items-center justify-end group relative h-full">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border rounded-md px-2 py-1 text-xs shadow-md whitespace-nowrap z-10">
                  {hour}시: {count}건
                </div>
                <div
                  className="w-full bg-[#8C9EFF] rounded-t-sm min-h-[1px]"
                  style={{ height: `${(count / hourMax) * 100}%` }}
                />
                {hour % 3 === 0 && (
                  <span className="text-[9px] text-muted-foreground mt-1">{hour}시</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageTab() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankBy, setRankBy] = useState<'records' | 'sessions' | 'duration' | 'pageViews'>('records');

  useEffect(() => {
    fetch('/api/admin/stats/usage')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-muted-foreground text-center py-8">데이터를 불러올 수 없습니다</p>;

  const rankData = rankBy === 'records' ? data.byRecords
    : rankBy === 'sessions' ? data.bySessions
    : rankBy === 'duration' ? data.byDuration
    : data.byPageViews;

  const rankLabel = rankBy === 'records' ? '데이터 수'
    : rankBy === 'sessions' ? '접속 횟수'
    : rankBy === 'duration' ? '총 체류시간'
    : '페이지뷰';

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Database className="h-5 w-5" />유저 사용량</h2>
        <Select value={rankBy} onValueChange={(v) => setRankBy((v || 'records') as any)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="records">데이터 수</SelectItem>
            <SelectItem value="sessions">접속 횟수</SelectItem>
            <SelectItem value="duration">체류시간</SelectItem>
            <SelectItem value="pageViews">페이지뷰</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">유저별 {rankLabel} 랭킹</CardTitle>
          <CardDescription>상위 15명</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>유저</TableHead>
                <TableHead className="text-right">상품</TableHead>
                <TableHead className="text-right">판매</TableHead>
                <TableHead className="text-right hidden sm:table-cell">광고</TableHead>
                <TableHead className="text-right hidden sm:table-cell">비용</TableHead>
                <TableHead className="text-right">접속</TableHead>
                <TableHead className="text-right hidden sm:table-cell">체류</TableHead>
                <TableHead className="text-right hidden sm:table-cell">PV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankData.map((u, i) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-[#8C9EFF] text-[#333]' : 'bg-muted text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{u.name || '-'}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{u.products}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.sales}</TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">{u.ads}</TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">{u.expenses}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.sessionCount}회</TableCell>
                  <TableCell className="text-right text-muted-foreground hidden sm:table-cell">{formatDuration(u.totalDuration)}</TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">{u.pageViews}</TableCell>
                </TableRow>
              ))}
              {rankData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    아직 사용량 데이터가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <p className="text-muted-foreground text-center py-8">통계를 불러올 수 없습니다</p>;

  const o = stats.overview;
  const trendMax = Math.max(...stats.dailyTrend.map(d => Math.max(d.signups, d.active)), 1);

  return (
    <div className="space-y-6 mt-4">
      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label="전체 유저" value={o.totalUsers} />
        <StatCard icon={UserCheck} label="7일 활성" value={o.activeIn7d} sub={`${o.totalUsers > 0 ? Math.round((o.activeIn7d / o.totalUsers) * 100) : 0}%`} />
        <StatCard icon={TrendingUp} label="7일 신규" value={o.newIn7d} />
        <StatCard icon={UserX} label="이탈 유저" value={o.churnedCount} sub={`이탈률 ${o.churnRate}%`} />
        <StatCard icon={BarChart3} label="총 판매건" value={o.totalSales} />
        <StatCard icon={Activity} label="30일 활성" value={o.activeIn30d} sub={`${o.totalUsers > 0 ? Math.round((o.activeIn30d / o.totalUsers) * 100) : 0}%`} />
      </div>

      {/* 일별 유입/활성 추이 (30일) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">일별 유입/활성 추이 (최근 30일)</CardTitle>
          <CardDescription>
            <span className="inline-flex items-center gap-1.5 mr-4"><span className="w-3 h-3 rounded-sm bg-[#D6F74C]" /> 신규 가입</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#8C9EFF]" /> 활성 접속</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[2px] h-[140px]">
            {stats.dailyTrend.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-[1px] h-full justify-end group relative">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border rounded-md px-2 py-1 text-xs shadow-md whitespace-nowrap z-10">
                  <p className="font-medium">{d.date}</p>
                  <p>가입 {d.signups}명 · 접속 {d.active}명</p>
                </div>
                <div
                  className="w-full bg-[#8C9EFF] rounded-t-sm min-h-[1px]"
                  style={{ height: `${(d.active / trendMax) * 100}%` }}
                />
                <div
                  className="w-full bg-[#D6F74C] rounded-t-sm min-h-[1px]"
                  style={{ height: `${(d.signups / trendMax) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{stats.dailyTrend[0]?.date}</span>
            <span className="text-[10px] text-muted-foreground">{stats.dailyTrend[stats.dailyTrend.length - 1]?.date}</span>
          </div>
        </CardContent>
      </Card>

      {/* 코호트 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">코호트 분석 (주별 가입 → 주차별 유지율)</CardTitle>
          <CardDescription>가입 주 기준, 이후 N주차에 재접속한 비율 (높을수록 유지 잘 됨)</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.cohort.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">가입 주</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">가입</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">1주 후</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">2주 후</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">3주 후</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">4주 후</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.cohort.map((c) => (
                    <tr key={c.week} className="border-b last:border-0">
                      <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{c.week}</td>
                      <td className="text-center py-2 px-2 font-medium">{c.signups}명</td>
                      {[1, 2, 3, 4].map((w) => {
                        const r = c.retention.find(ret => ret.week === w);
                        if (!r) return <td key={w} className="text-center py-2 px-2 text-muted-foreground">-</td>;
                        const bg = r.rate >= 60 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : r.rate >= 30 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : r.rate > 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'text-muted-foreground';
                        return (
                          <td key={w} className="text-center py-2 px-2">
                            <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${bg}`}>
                              {r.rate}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">활동량 TOP 유저</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topUsers.map((u, i) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-[#8C9EFF] text-[#333]' : 'bg-muted text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <span className="font-medium">{u.name || u.email}</span>
                  </div>
                  <Badge variant="secondary">{u.salesCount}건</Badge>
                </div>
              ))}
              {stats.topUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="h-4 w-4" />비활성 / 이탈 유저
            </CardTitle>
            <CardDescription>7일 이상 미접속 또는 활동 없는 유저</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.inactiveUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <span>{u.name || u.email || u.id.slice(0, 8)}</span>
                  <Badge variant="outline">활동 없음</Badge>
                </div>
              ))}
              {stats.inactiveUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">모든 유저가 활동 중입니다</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [actionDialog, setActionDialog] = useState<{ type: string; user: UserData; reason?: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (search) sp.set('search', search);
    if (statusFilter !== 'all') sp.set('status', statusFilter);
    sp.set('sortBy', sortBy);
    const res = await fetch(`/api/admin/users?${sp}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [search, statusFilter, sortBy]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async () => {
    if (!actionDialog) return;
    setActionLoading(true);
    const { type, user } = actionDialog;

    if (type === 'delete') {
      await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    } else {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type,
          ...(type === 'suspend' && actionDialog.reason ? { reason: actionDialog.reason } : {}),
        }),
      });
    }

    setActionLoading(false);
    setActionDialog(null);
    fetchUsers();
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이메일 또는 이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="suspended">정지</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v || 'created_at')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">가입일순</SelectItem>
            <SelectItem value="last_sign_in">최근 접속순</SelectItem>
            <SelectItem value="activity">활동량순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>유저</TableHead>
                  <TableHead className="hidden sm:table-cell">가입일</TableHead>
                  <TableHead className="hidden sm:table-cell">최근 접속</TableHead>
                  <TableHead>활동</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{u.name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('ko-KR') : '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{u.stats.totalActivity}건</span>
                    </TableCell>
                    <TableCell>
                      {u.status === 'suspended' ? (
                        <Badge variant="destructive" className="text-xs">정지</Badge>
                      ) : (
                        <Badge className="bg-[#8C9EFF]/20 text-[#4a5abf] border-0 text-xs">활성</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.status === 'suspended' ? (
                          <Button variant="ghost" size="icon" title="활성화" onClick={() => setActionDialog({ type: 'activate', user: u })}>
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" title="일시정지" onClick={() => setActionDialog({ type: 'suspend', user: u, reason: '' })}>
                            <Pause className="h-4 w-4 text-amber-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="데이터 초기화" onClick={() => setActionDialog({ type: 'reset_data', user: u })}>
                          <RotateCcw className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" title="계정 삭제" onClick={() => setActionDialog({ type: 'delete', user: u })}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      유저가 없습니다
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.type === 'delete' && '계정 삭제'}
              {actionDialog?.type === 'suspend' && '계정 일시정지'}
              {actionDialog?.type === 'activate' && '계정 활성화'}
              {actionDialog?.type === 'reset_data' && '데이터 초기화'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{actionDialog?.user.name || actionDialog?.user.email}</strong>
              {actionDialog?.type === 'delete' && ' 계정을 영구 삭제합니다. 이 작업은 되돌릴 수 없습니다.'}
              {actionDialog?.type === 'suspend' && ' 계정을 일시정지합니다.'}
              {actionDialog?.type === 'activate' && ' 계정을 다시 활성화합니다.'}
              {actionDialog?.type === 'reset_data' && ' 의 모든 데이터(판매, 상품, 광고비, 운영비, 목표)를 삭제합니다.'}
            </AlertDialogDescription>
            {actionDialog?.type === 'suspend' && (
              <div className="mt-3">
                <Label>정지 사유</Label>
                <Input
                  placeholder="정지 사유를 입력하세요"
                  value={actionDialog.reason || ''}
                  onChange={(e) => setActionDialog({ ...actionDialog, reason: e.target.value })}
                />
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className={actionDialog?.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  // 알림 관련 상태
  const [notifForm, setNotifForm] = useState({ target: 'all', title: '', message: '' });
  const [notifSending, setNotifSending] = useState(false);
  const [notifResult, setNotifResult] = useState<string | null>(null);

  // 유저 선택 관련 상태
  const [notifUsers, setNotifUsers] = useState<UserData[]>([]);
  const [notifUsersLoading, setNotifUsersLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState('');
  const [userSortBy, setUserSortBy] = useState('created_at');
  const [userActivityFilter, setUserActivityFilter] = useState('all');
  const [userDateFilter, setUserDateFilter] = useState('all');

  const fetchAnnouncements = useCallback(async () => {
    const res = await fetch('/api/admin/announcements');
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const fetchNotifUsers = useCallback(async () => {
    setNotifUsersLoading(true);
    const sp = new URLSearchParams();
    if (userSearch) sp.set('search', userSearch);
    sp.set('sortBy', userSortBy);
    const res = await fetch(`/api/admin/users?${sp}`);
    const data = await res.json();
    setNotifUsers(data.users || []);
    setNotifUsersLoading(false);
  }, [userSearch, userSortBy]);

  useEffect(() => {
    if (notifForm.target === 'selected') fetchNotifUsers();
  }, [notifForm.target, fetchNotifUsers]);

  const filteredNotifUsers = useMemo(() => {
    let filtered = notifUsers;

    if (userActivityFilter === 'active') {
      filtered = filtered.filter(u => u.stats.totalActivity >= 5);
    } else if (userActivityFilter === 'low') {
      filtered = filtered.filter(u => u.stats.totalActivity > 0 && u.stats.totalActivity < 5);
    } else if (userActivityFilter === 'inactive') {
      filtered = filtered.filter(u => u.stats.totalActivity === 0);
    }

    if (userDateFilter === '7d') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      filtered = filtered.filter(u => new Date(u.created_at) >= d);
    } else if (userDateFilter === '30d') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      filtered = filtered.filter(u => new Date(u.created_at) >= d);
    } else if (userDateFilter === 'no_login_7d') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      filtered = filtered.filter(u => !u.last_sign_in_at || new Date(u.last_sign_in_at) < d);
    } else if (userDateFilter === 'no_login_30d') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      filtered = filtered.filter(u => !u.last_sign_in_at || new Date(u.last_sign_in_at) < d);
    }

    return filtered;
  }, [notifUsers, userActivityFilter, userDateFilter]);

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedUserIds.size === filteredNotifUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredNotifUsers.map(u => u.id)));
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title: '', content: '' });
    fetchAnnouncements();
  };

  const handleToggleAnnouncement = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    });
    fetchAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    fetchAnnouncements();
  };

  const handleSendNotification = async () => {
    if (!notifForm.title || !notifForm.message) return;
    if (notifForm.target === 'selected' && selectedUserIds.size === 0) {
      setNotifResult('오류: 유저를 선택해주세요');
      return;
    }
    setNotifSending(true);
    setNotifResult(null);

    if (notifForm.target === 'all') {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'all', title: notifForm.title, message: notifForm.message }),
      });
      const data = await res.json();
      setNotifSending(false);
      if (data.success) {
        setNotifResult(`${data.sent}명에게 알림을 전송했습니다`);
        setNotifForm({ target: 'all', title: '', message: '' });
      } else {
        setNotifResult(`오류: ${data.error}`);
      }
    } else {
      let sentCount = 0;
      for (const userId of selectedUserIds) {
        const res = await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: 'user', userId, title: notifForm.title, message: notifForm.message }),
        });
        const data = await res.json();
        if (data.success) sentCount += data.sent;
      }
      setNotifSending(false);
      setNotifResult(`${sentCount}명에게 알림을 전송했습니다`);
      setNotifForm({ target: 'all', title: '', message: '' });
      setSelectedUserIds(new Set());
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />알림 보내기</CardTitle>
          <CardDescription>전체 또는 선택한 유저에게 알림 발송</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>대상</Label>
            <Select value={notifForm.target} onValueChange={(v) => setNotifForm({ ...notifForm, target: v || 'all' })}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유저</SelectItem>
                <SelectItem value="selected">유저 선택</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {notifForm.target === 'selected' && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="이름 또는 이메일 검색..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={userActivityFilter} onValueChange={(v) => setUserActivityFilter(v || 'all')}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="활동량" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="active">활발 (5건+)</SelectItem>
                    <SelectItem value="low">저활동 (1~4건)</SelectItem>
                    <SelectItem value="inactive">미활동 (0건)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userDateFilter} onValueChange={(v) => setUserDateFilter(v || 'all')}>
                  <SelectTrigger className="w-[170px]"><SelectValue placeholder="기간 필터" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 기간</SelectItem>
                    <SelectItem value="7d">최근 7일 가입</SelectItem>
                    <SelectItem value="30d">최근 30일 가입</SelectItem>
                    <SelectItem value="no_login_7d">7일 이상 미접속</SelectItem>
                    <SelectItem value="no_login_30d">30일 이상 미접속</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userSortBy} onValueChange={(v) => setUserSortBy(v || 'created_at')}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="정렬" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">가입일순</SelectItem>
                    <SelectItem value="last_sign_in">최근접속순</SelectItem>
                    <SelectItem value="activity">활동량순</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-primary hover:underline"
                >
                  {selectedUserIds.size === filteredNotifUsers.length && filteredNotifUsers.length > 0 ? '전체 해제' : '전체 선택'}
                </button>
                <span className="text-xs text-muted-foreground">
                  {selectedUserIds.size}명 선택 / {filteredNotifUsers.length}명
                </span>
              </div>

              {notifUsersLoading ? <LoadingSpinner /> : (
                <div className="max-h-[280px] overflow-y-auto border rounded-md divide-y">
                  {filteredNotifUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">조건에 맞는 유저가 없습니다</p>
                  ) : filteredNotifUsers.map((u) => (
                    <label
                      key={u.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${selectedUserIds.has(u.id) ? 'bg-primary/5' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="rounded border-gray-300 h-4 w-4 accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">활동 {u.stats.totalActivity}건</p>
                        <p className="text-[10px] text-muted-foreground">
                          {u.last_sign_in_at ? `접속 ${new Date(u.last_sign_in_at).toLocaleDateString('ko-KR')}` : '미접속'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>제목</Label>
              <Input placeholder="알림 제목" value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} />
            </div>
            <div>
              <Label>내용</Label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="알림 내용을 입력하세요"
                value={notifForm.message}
                onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
              />
            </div>
          </div>

          {notifResult && (
            <p className={`text-sm ${notifResult.startsWith('오류') ? 'text-red-600' : 'text-green-600'}`}>{notifResult}</p>
          )}
          <Button onClick={handleSendNotification} disabled={notifSending || !notifForm.title || !notifForm.message}>
            {notifSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {notifForm.target === 'all' ? '전체 발송' : `${selectedUserIds.size}명에게 발송`}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4" />공지사항</CardTitle>
            <CardDescription>앱 내 공지사항 관리</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" />새 공지
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div>
                <Label>제목</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="공지 제목" />
              </div>
              <div>
                <Label>내용</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="공지 내용을 입력하세요"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateAnnouncement} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}저장
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>취소</Button>
              </div>
            </div>
          )}

          {loading ? <LoadingSpinner /> : announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">공지사항이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{a.title}</h3>
                        <Badge variant={a.is_active ? 'default' : 'secondary'}>
                          {a.is_active ? '게시 중' : '비활성'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleToggleAnnouncement(a.id, a.is_active)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAnnouncement(a.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('limit', '30');
    if (actionFilter) sp.set('action', actionFilter);
    const res = await fetch(`/api/admin/logs?${sp}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actionLabels: Record<string, string> = {
    login: '로그인',
    page_view: '페이지 조회',
    create_product: '상품 등록',
    create_sale: '판매 등록',
    create_expense: '비용 등록',
    import_data: '데이터 가져오기',
    export_data: '데이터 내보내기',
    calculate: '계산',
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-3">
        <Select value={actionFilter} onValueChange={(v) => setActionFilter(v || '')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="액션 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {Object.entries(actionLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>유저</TableHead>
                  <TableHead>액션</TableHead>
                  <TableHead className="hidden sm:table-cell">리소스</TableHead>
                  <TableHead className="hidden sm:table-cell">상세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.profiles?.name || log.profiles?.email || log.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {log.resource || '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      활동 로그가 없습니다
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {total > 30 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</Button>
          <span className="text-sm text-muted-foreground flex items-center">{page} / {Math.ceil(total / 30)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(page + 1)}>다음</Button>
        </div>
      )}
    </div>
  );
}

function AdsTab() {
  const [banners, setBanners] = useState<AdBannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', highlight: '', link_url: '', image_url: '',
    bg_color: '#4a5abf', text_color: '#ffffff', highlight_color: '#D6F74C', sort_order: 0,
  });

  const fetchBanners = useCallback(async () => {
    const res = await fetch('/api/admin/ads');
    const data = await res.json();
    setBanners(data.banners || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const resetForm = () => {
    setForm({ title: '', subtitle: '', highlight: '', link_url: '', image_url: '', bg_color: '#4a5abf', text_color: '#ffffff', highlight_color: '#D6F74C', sort_order: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (b: AdBannerData) => {
    setForm({
      title: b.title, subtitle: b.subtitle || '', highlight: b.highlight || '',
      link_url: b.link_url || '', image_url: b.image_url || '',
      bg_color: b.bg_color, text_color: b.text_color, highlight_color: b.highlight_color,
      sort_order: b.sort_order,
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);

    if (editingId) {
      await fetch(`/api/admin/ads/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }

    setSaving(false);
    resetForm();
    fetchBanners();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/ads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    });
    fetchBanners();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' });
    fetchBanners();
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const idx = banners.findIndex(b => b.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;

    const current = banners[idx];
    const swap = banners[swapIdx];

    await Promise.all([
      fetch(`/api/admin/ads/${current.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: swap.sort_order }),
      }),
      fetch(`/api/admin/ads/${swap.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: current.sort_order }),
      }),
    ]);
    fetchBanners();
  };

  const [slideInterval, setSlideInterval] = useState(4);
  const [savingInterval, setSavingInterval] = useState(false);

  useEffect(() => {
    if (banners.length > 0) {
      setSlideInterval((banners[0] as any).slide_interval ? (banners[0] as any).slide_interval / 1000 : 4);
    }
  }, [banners]);

  const handleSaveInterval = async () => {
    setSavingInterval(true);
    const ms = Math.max(1000, Math.round(slideInterval * 1000));
    await Promise.all(banners.map(b =>
      fetch(`/api/admin/ads/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide_interval: ms }),
      })
    ));
    setSavingInterval(false);
    fetchBanners();
  };

  return (
    <div className="space-y-6 mt-4">
      {/* 슬라이드 전환 시간 설정 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium whitespace-nowrap">슬라이드 전환 시간</Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={30}
                step={0.5}
                value={slideInterval}
                onChange={(e) => setSlideInterval(parseFloat(e.target.value) || 1)}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">초</span>
            </div>
            <Button size="sm" variant="outline" onClick={handleSaveInterval} disabled={savingInterval}>
              {savingInterval && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              저장
            </Button>
            <span className="text-xs text-muted-foreground">모든 배너에 공통 적용됩니다</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Image className="h-4 w-4" />광고 배너 관리</CardTitle>
            <CardDescription>하단 광고 영역에 표시되는 배너를 관리합니다</CardDescription>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" />새 배너
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h3 className="font-medium text-sm">{editingId ? '배너 수정' : '새 배너 추가'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>메인 문구 *</Label>
                  <Input placeholder="예: 패션풀필먼트는" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>강조 텍스트</Label>
                  <Input placeholder="예: 스프링" value={form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.value })} />
                </div>
                <div>
                  <Label>상단 서브 문구</Label>
                  <Input placeholder="예: Fashion Fulfillment" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
                </div>
                <div>
                  <Label>링크 URL</Label>
                  <Input placeholder="https://example.com" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>이미지 URL</Label>
                  <Input placeholder="https://example.com/banner.png" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                </div>
                <div>
                  <Label>배경색</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.bg_color} onChange={(e) => setForm({ ...form, bg_color: e.target.value })} className="h-9 w-12 rounded border cursor-pointer" />
                    <Input value={form.bg_color} onChange={(e) => setForm({ ...form, bg_color: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>텍스트 색상</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.text_color} onChange={(e) => setForm({ ...form, text_color: e.target.value })} className="h-9 w-12 rounded border cursor-pointer" />
                    <Input value={form.text_color} onChange={(e) => setForm({ ...form, text_color: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>강조 색상</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.highlight_color} onChange={(e) => setForm({ ...form, highlight_color: e.target.value })} className="h-9 w-12 rounded border cursor-pointer" />
                    <Input value={form.highlight_color} onChange={(e) => setForm({ ...form, highlight_color: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>정렬 순서</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              {/* 미리보기 */}
              <div>
                <Label className="mb-2 block">미리보기</Label>
                <div
                  className="rounded-lg py-8 px-4 text-center space-y-2"
                  style={{ backgroundColor: form.bg_color, color: form.text_color }}
                >
                  {form.image_url && (
                    <img src={form.image_url} alt="" className="max-h-20 mx-auto mb-3 object-contain rounded" />
                  )}
                  {form.subtitle && (
                    <p className="text-xs tracking-[0.2em] uppercase opacity-50">{form.subtitle}</p>
                  )}
                  <p className="text-xl font-bold">
                    {form.title}{' '}
                    {form.highlight && <span style={{ color: form.highlight_color }}>{form.highlight}</span>}
                  </p>
                  {form.link_url && (
                    <p className="text-xs opacity-40">{form.link_url.replace(/^https?:\/\//, '')}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving || !form.title}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? '수정' : '추가'}
                </Button>
                <Button variant="outline" onClick={resetForm}>취소</Button>
              </div>
            </div>
          )}

          {loading ? <LoadingSpinner /> : banners.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">등록된 광고 배너가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {banners.map((b, i) => (
                <div key={b.id} className="border rounded-lg overflow-hidden">
                  {/* 배너 미리보기 */}
                  <div
                    className="py-6 px-4 text-center space-y-1"
                    style={{ backgroundColor: b.bg_color, color: b.text_color }}
                  >
                    {b.image_url && (
                      <img src={b.image_url} alt="" className="max-h-16 mx-auto mb-2 object-contain rounded" />
                    )}
                    {b.subtitle && (
                      <p className="text-xs tracking-[0.2em] uppercase opacity-50">{b.subtitle}</p>
                    )}
                    <p className="text-lg font-bold">
                      {b.title}{' '}
                      {b.highlight && <span style={{ color: b.highlight_color }}>{b.highlight}</span>}
                    </p>
                    {b.link_url && (
                      <p className="text-xs opacity-40">{b.link_url.replace(/^https?:\/\//, '')}</p>
                    )}
                  </div>
                  {/* 컨트롤 바 */}
                  <div className="flex items-center justify-between px-4 py-2 bg-background border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant={b.is_active ? 'default' : 'secondary'}>
                        {b.is_active ? '활성' : '비활성'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">순서: {b.sort_order}</span>
                      {b.link_url && (
                        <a href={b.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />{b.link_url.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" title="위로" onClick={() => handleMove(b.id, 'up')} disabled={i === 0}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="아래로" onClick={() => handleMove(b.id, 'down')} disabled={i === banners.length - 1}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title={b.is_active ? '비활성화' : '활성화'} onClick={() => handleToggle(b.id, b.is_active)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="수정" onClick={() => startEdit(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="삭제" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value.toLocaleString()}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 방문자 분석 탭 ─────────────────────────────────
interface VisitorData {
  summary: {
    totalSessions: number; uniqueIPs: number; loggedInSessions: number;
    anonymousSessions: number; totalPageViews: number; avgSessionDuration: number;
    avgPagesPerSession: number; period: number;
  };
  realtime: { activeVisitors: number; activeSessions: number; topPages: { path: string; count: number }[] };
  ipStats: {
    ip: string; visits: number; pageViews: number; avgDuration: number;
    totalDuration: number; uniquePages: number; lastSeen: string;
    isLoggedIn: boolean; device: string;
  }[];
  dailyTrend: {
    date: string; sessions: number; uniqueIPs: number; loggedIn: number;
    anonymous: number; pageViews: number; avgDuration: number;
  }[];
  hourlyVisitors: number[];
  deviceBreakdown: { device: string; count: number }[];
  recentSessions: {
    sessionId: string; ip: string; isLoggedIn: boolean; entryPage: string;
    exitPage: string; pageCount: number; duration: number; device: string;
    startedAt: string; pages: { path: string; duration: number }[];
  }[];
  pagesByDuration: {
    path: string; views: number; avgDuration: number; totalDuration: number; uniqueVisitors: number;
  }[];
}

function VisitorsTab() {
  const [data, setData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');
  const [ipSearch, setIpSearch] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats/visitors?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch { /* ignore */ }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-muted-foreground text-center py-8">데이터를 불러올 수 없습니다</p>;

  const filteredIPs = ipSearch
    ? data.ipStats.filter(s => s.ip.includes(ipSearch))
    : data.ipStats;

  const dailyMax = Math.max(...data.dailyTrend.map(d => d.sessions), 1);
  const hourMax = Math.max(...data.hourlyVisitors, 1);

  const DEVICE_LABEL: Record<string, string> = { desktop: '데스크톱', mobile: '모바일', tablet: '태블릿', bot: '봇', unknown: '기타' };
  const DEVICE_ICON: Record<string, any> = { desktop: Monitor, mobile: Smartphone, tablet: TabletSmartphone, bot: Globe, unknown: Globe };

  return (
    <div className="space-y-6 mt-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Wifi className="h-5 w-5" />방문자 분석</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-1.5"
          >
            <Radio className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? '실시간' : '자동새로고침'}
          </Button>
          <Select value={days} onValueChange={(v) => setDays(v || '30')}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">오늘</SelectItem>
              <SelectItem value="7">최근 7일</SelectItem>
              <SelectItem value="14">최근 14일</SelectItem>
              <SelectItem value="30">최근 30일</SelectItem>
              <SelectItem value="90">최근 90일</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 실시간 방문자 */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Radio className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.realtime.activeVisitors}</p>
                <p className="text-xs text-muted-foreground">현재 접속자 (5분 이내)</p>
              </div>
            </div>
            {data.realtime.topPages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.realtime.topPages.slice(0, 5).map((p) => (
                  <Badge key={p.path} variant="secondary" className="text-xs">
                    {p.path} <span className="ml-1 font-bold">{p.count}</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard icon={Wifi} label="총 세션" value={data.summary.totalSessions} />
        <StatCard icon={MapPin} label="고유 IP" value={data.summary.uniqueIPs} />
        <StatCard icon={UserRound} label="로그인 방문" value={data.summary.loggedInSessions} />
        <StatCard icon={Ghost} label="비로그인 방문" value={data.summary.anonymousSessions} />
        <StatCard icon={Eye} label="총 페이지뷰" value={data.summary.totalPageViews} />
        <StatCard icon={Timer} label="평균 체류" value={0} sub={formatDuration(data.summary.avgSessionDuration)} />
        <StatCard icon={Globe} label="세션당 페이지" value={data.summary.avgPagesPerSession} />
      </div>

      {/* 일별 방문 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">일별 방문 추이</CardTitle>
          <CardDescription>
            <span className="inline-flex items-center gap-1.5 mr-4"><span className="w-3 h-3 rounded-sm bg-[#8C9EFF]" /> 세션 수</span>
            <span className="inline-flex items-center gap-1.5 mr-4"><span className="w-3 h-3 rounded-sm bg-[#D6F74C]" /> 고유 IP</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[2px] h-[140px]">
            {data.dailyTrend.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-[1px] h-full justify-end group relative">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border rounded-md px-2 py-1 text-xs shadow-md whitespace-nowrap z-10">
                  <p className="font-medium">{d.date}</p>
                  <p>세션 {d.sessions} · IP {d.uniqueIPs}</p>
                  <p>로그인 {d.loggedIn} · 비로그인 {d.anonymous}</p>
                  <p>PV {d.pageViews} · 평균체류 {formatDuration(d.avgDuration)}</p>
                </div>
                <div className="w-full bg-[#8C9EFF] rounded-t-sm min-h-[1px]" style={{ height: `${(d.sessions / dailyMax) * 100}%` }} />
                <div className="w-full bg-[#D6F74C] rounded-t-sm min-h-[1px]" style={{ height: `${(d.uniqueIPs / dailyMax) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{data.dailyTrend[0]?.date}</span>
            <span className="text-[10px] text-muted-foreground">{data.dailyTrend[data.dailyTrend.length - 1]?.date}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시간대별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />시간대별 접속</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-32">
              {data.hourlyVisitors.map((count, h) => (
                <div key={h} className="flex-1 flex flex-col items-center justify-end group relative h-full">
                  <div className="absolute -top-6 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {h}시: {count}
                  </div>
                  <div
                    className="w-full bg-[#8C9EFF]/50 hover:bg-[#8C9EFF]/80 rounded-t-sm transition-colors"
                    style={{ height: `${(count / hourMax) * 100}%`, minHeight: count > 0 ? '2px' : '0' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
              <span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>23시</span>
            </div>
          </CardContent>
        </Card>

        {/* 디바이스 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MonitorSmartphone className="h-4 w-4" />디바이스별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            {data.deviceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
            ) : (
              <div className="space-y-3">
                {data.deviceBreakdown.map((d) => {
                  const DevIcon = DEVICE_ICON[d.device] || Globe;
                  const pct = data!.summary.totalSessions > 0 ? Math.round((d.count / data!.summary.totalSessions) * 100) : 0;
                  return (
                    <div key={d.device} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <DevIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{DEVICE_LABEL[d.device] || d.device}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{d.count}</span>
                            <Badge variant="secondary">{pct}%</Badge>
                          </div>
                        </div>
                        <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-[#8C9EFF] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 페이지별 체류시간 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4" />페이지별 체류시간 TOP</CardTitle>
          <CardDescription>평균 체류시간이 긴 페이지 순</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>페이지</TableHead>
                <TableHead className="text-right">조회수</TableHead>
                <TableHead className="text-right">고유 방문자</TableHead>
                <TableHead className="text-right">평균 체류</TableHead>
                <TableHead className="text-right hidden sm:table-cell">총 체류</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pagesByDuration.map((p) => (
                <TableRow key={p.path}>
                  <TableCell className="font-mono text-sm">{p.path}</TableCell>
                  <TableCell className="text-right">{p.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{p.uniqueVisitors.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">{formatDuration(p.avgDuration)}</TableCell>
                  <TableCell className="text-right text-muted-foreground hidden sm:table-cell">{formatDuration(p.totalDuration)}</TableCell>
                </TableRow>
              ))}
              {data.pagesByDuration.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">데이터 없음</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* IP별 통계 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />IP별 방문 통계</CardTitle>
              <CardDescription>방문 횟수가 많은 IP 순</CardDescription>
            </div>
            <div className="relative w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="IP 검색..." value={ipSearch} onChange={(e) => setIpSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">방문수</TableHead>
                <TableHead className="text-right">페이지뷰</TableHead>
                <TableHead className="text-right hidden sm:table-cell">평균 체류</TableHead>
                <TableHead className="text-right hidden sm:table-cell">고유 페이지</TableHead>
                <TableHead className="text-center">디바이스</TableHead>
                <TableHead className="text-center">유형</TableHead>
                <TableHead className="hidden sm:table-cell">최근 방문</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIPs.slice(0, 50).map((s) => {
                const DevIcon = DEVICE_ICON[s.device] || Globe;
                return (
                  <TableRow key={s.ip}>
                    <TableCell className="font-mono text-sm">{s.ip}</TableCell>
                    <TableCell className="text-right font-bold">{s.visits}</TableCell>
                    <TableCell className="text-right">{s.pageViews}</TableCell>
                    <TableCell className="text-right text-muted-foreground hidden sm:table-cell">{formatDuration(s.avgDuration)}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{s.uniquePages}</TableCell>
                    <TableCell className="text-center"><DevIcon className="h-4 w-4 mx-auto text-muted-foreground" /></TableCell>
                    <TableCell className="text-center">
                      {s.isLoggedIn ? (
                        <Badge className="bg-[#8C9EFF]/20 text-[#4a5abf] border-0 text-xs">회원</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">비회원</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(s.lastSeen).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredIPs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {ipSearch ? '검색 결과가 없습니다' : '데이터 없음'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 최근 방문 세션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" />최근 방문 세션</CardTitle>
          <CardDescription>최근 50개 세션 (클릭하여 상세 보기)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {data.recentSessions.map((s) => {
              const isExpanded = expandedSession === s.sessionId;
              const DevIcon = DEVICE_ICON[s.device] || Globe;
              return (
                <div key={s.sessionId}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => setExpandedSession(isExpanded ? null : s.sessionId)}
                  >
                    <div className="shrink-0">
                      <DevIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm">{s.ip}</span>
                        {s.isLoggedIn ? (
                          <Badge className="bg-[#8C9EFF]/20 text-[#4a5abf] border-0 text-[10px]">회원</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">비회원</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{s.pageCount}페이지</span>
                        <span className="text-xs text-muted-foreground">{formatDuration(s.duration)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {s.entryPage} → {s.exitPage || s.entryPage}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.startedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && s.pages.length > 0 && (
                    <div className="px-4 pb-3 pl-12">
                      <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                        {s.pages.map((page, i) => (
                          <div key={`${page.path}-${i}`} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                              <span className="font-mono">{page.path}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{formatDuration(page.duration)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {data.recentSessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">최근 세션 데이터가 없습니다</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── 광고 성과 분석 탭 ─────────────────────────────────
interface AdAnalyticsData {
  summary: { totalImpressions: number; totalClicks: number; overallCTR: number; uniqueUsers: number; uniqueIPs: number; period: number };
  bannerStats: { id: string; title: string; highlight: string | null; link_url: string | null; is_active: boolean; impressions: number; clicks: number; uniqueClickers: number; ctr: number }[];
  deviceBreakdown: { device: string; impressions: number; clicks: number }[];
  topPages: { path: string; clicks: number }[];
  topReferrers: { source: string; clicks: number }[];
  dailyTrend: { date: string; impressions: number; clicks: number }[];
  hourlyClicks: number[];
}

const DEVICE_LABELS: Record<string, string> = { mobile: '모바일', tablet: '태블릿', desktop: '데스크톱', unknown: '기타' };
const DEVICE_ICONS: Record<string, any> = { mobile: Smartphone, tablet: TabletSmartphone, desktop: Monitor, unknown: Globe };

function AdAnalyticsTab() {
  const [data, setData] = useState<AdAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/ads/analytics?days=${days}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-center text-muted-foreground py-8">데이터를 불러올 수 없습니다</p>;

  const { summary, bannerStats, deviceBreakdown, topPages, topReferrers, dailyTrend, hourlyClicks } = data;
  const maxHourly = Math.max(...hourlyClicks, 1);

  return (
    <div className="space-y-6 mt-4">
      {/* 기간 선택 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MousePointerClick className="h-5 w-5 text-primary" />
          광고 성과 분석
        </h2>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">최근 7일</SelectItem>
            <SelectItem value="14">최근 14일</SelectItem>
            <SelectItem value="30">최근 30일</SelectItem>
            <SelectItem value="90">최근 90일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">노출 수</p>
            <p className="text-2xl font-bold text-[#4a5abf]">{summary.totalImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">클릭 수</p>
            <p className="text-2xl font-bold text-[#4a5abf]">{summary.totalClicks.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">CTR</p>
            <p className="text-2xl font-bold">{summary.overallCTR}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">고유 방문자</p>
            <p className="text-2xl font-bold">{summary.uniqueIPs.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* 일별 추이 차트 */}
      {dailyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">일별 노출/클릭 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailyTrend.slice(-14).map((d) => {
                const maxVal = Math.max(...dailyTrend.map(t => t.impressions), 1);
                return (
                  <div key={d.date} className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-muted-foreground shrink-0">{d.date.slice(5)}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="h-4 bg-[#8C9EFF]/30 rounded-sm" style={{ width: `${(d.impressions / maxVal) * 100}%`, minWidth: d.impressions > 0 ? '4px' : '0' }} />
                      <span className="text-muted-foreground w-12 text-right">{d.impressions}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="h-4 bg-[#D6F74C]/60 rounded-sm" style={{ width: `${(d.clicks / maxVal) * 100}%`, minWidth: d.clicks > 0 ? '4px' : '0' }} />
                      <span className="text-muted-foreground w-12 text-right">{d.clicks}</span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#8C9EFF]/30 rounded-sm inline-block" /> 노출</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#D6F74C]/60 rounded-sm inline-block" /> 클릭</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 배너별 성과 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">배너별 성과</CardTitle>
        </CardHeader>
        <CardContent>
          {bannerStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">등록된 배너가 없습니다</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>배너</TableHead>
                    <TableHead className="text-right">노출</TableHead>
                    <TableHead className="text-right">클릭</TableHead>
                    <TableHead className="text-right">고유 클릭</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannerStats.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{b.title} {b.highlight && <span className="text-primary">{b.highlight}</span>}</p>
                          {b.link_url && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{b.link_url}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{b.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{b.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{b.uniqueClickers.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={b.ctr >= 5 ? 'default' : b.ctr >= 1 ? 'secondary' : 'outline'}>
                          {b.ctr}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={b.is_active ? 'default' : 'secondary'}>
                          {b.is_active ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 디바이스별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4" />
              디바이스별 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
            ) : (
              <div className="space-y-3">
                {deviceBreakdown.map((d) => {
                  const DevIcon = DEVICE_ICONS[d.device] || Globe;
                  const totalDevice = d.impressions + d.clicks;
                  const deviceCTR = d.impressions > 0 ? (d.clicks / d.impressions * 100).toFixed(1) : '0';
                  return (
                    <div key={d.device} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <DevIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{DEVICE_LABELS[d.device] || d.device}</p>
                        <p className="text-xs text-muted-foreground">
                          노출 {d.impressions.toLocaleString()} · 클릭 {d.clicks.toLocaleString()} · CTR {deviceCTR}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 시간대별 클릭 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              시간대별 클릭
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-32">
              {hourlyClicks.map((count, h) => (
                <div key={h} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                  <div
                    className="w-full bg-[#8C9EFF]/40 hover:bg-[#8C9EFF]/70 rounded-t-sm transition-colors"
                    style={{ height: `${(count / maxHourly) * 100}%`, minHeight: count > 0 ? '2px' : '0' }}
                  />
                  <div className="absolute -top-6 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {h}시: {count}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
              <span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>23시</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 클릭 발생 페이지 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              클릭 발생 페이지 TOP 10
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {topPages.map((p, i) => (
                  <div key={p.path} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm truncate">{p.path}</span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 ml-2">{p.clicks}회</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 유입 경로 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              유입 경로 (Referrer)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topReferrers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {topReferrers.map((r, i) => (
                  <div key={r.source} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm truncate">{r.source}</span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 ml-2">{r.clicks}회</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
