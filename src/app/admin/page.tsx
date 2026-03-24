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
  GripVertical, Pencil, ChevronUp, ChevronDown,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">통계</span>
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
            <TabsTrigger value="logs" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" /><span className="hidden sm:inline">로그</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="pages"><PagesTab /></TabsContent>
          <TabsContent value="usage"><UsageTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
          <TabsContent value="ads"><AdsTab /></TabsContent>
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

  return (
    <div className="space-y-6 mt-4">
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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
