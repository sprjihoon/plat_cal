'use client';

import { useState, useEffect, useCallback } from 'react';
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
  TrendingDown, Activity, UserCheck, UserX, Eye,
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
    totalSales: number;
    totalProducts: number;
  };
  cohort: { week: string; signups: number; retained: number; rate: number }[];
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />통계
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />유저
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-1.5">
              <Megaphone className="h-4 w-4" />공지/알림
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" />로그
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
          <TabsContent value="logs"><LogsTab /></TabsContent>
        </Tabs>
      </main>
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

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="전체 유저" value={o.totalUsers} />
        <StatCard icon={UserCheck} label="7일 활성" value={o.activeIn7d} sub={`${o.totalUsers > 0 ? Math.round((o.activeIn7d / o.totalUsers) * 100) : 0}%`} />
        <StatCard icon={TrendingUp} label="7일 신규" value={o.newIn7d} />
        <StatCard icon={BarChart3} label="총 판매건" value={o.totalSales} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">코호트 분석 (주별 가입 → 재방문)</CardTitle>
            <CardDescription>가입 후 24시간 이후 재로그인한 비율</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.cohort.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {stats.cohort.map((c) => (
                  <div key={c.week} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{c.week}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#8C9EFF] to-[#6b7fef] rounded-full transition-all"
                        style={{ width: `${c.rate}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {c.signups}명 가입 · {c.rate}% 재방문
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">활동량 TOP 유저</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topUsers.map((u, i) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-[#D6F74C] text-[#333]' : 'bg-muted text-muted-foreground'}`}>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="h-4 w-4" />비활성 유저 (활동 없음)
            </CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />활동량 최소 유저
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.leastActiveUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <span>{u.name || u.email}</span>
                  <Badge variant="outline">{u.salesCount}건</Badge>
                </div>
              ))}
              {stats.leastActiveUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">데이터 없음</p>
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
                        <Badge className="bg-[#D6F74C]/20 text-[#6b7a1a] border-0 text-xs">활성</Badge>
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

  const [notifForm, setNotifForm] = useState({ target: 'all', userId: '', title: '', message: '' });
  const [notifSending, setNotifSending] = useState(false);
  const [notifResult, setNotifResult] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    const res = await fetch('/api/admin/announcements');
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

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
    setNotifSending(true);
    setNotifResult(null);
    const res = await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifForm),
    });
    const data = await res.json();
    setNotifSending(false);
    if (data.success) {
      setNotifResult(`${data.sent}명에게 알림을 전송했습니다`);
      setNotifForm({ target: 'all', userId: '', title: '', message: '' });
    } else {
      setNotifResult(`오류: ${data.error}`);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />알림 보내기</CardTitle>
            <CardDescription>전체 또는 특정 유저에게 알림 발송</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>대상</Label>
              <Select value={notifForm.target} onValueChange={(v) => setNotifForm({ ...notifForm, target: v || 'all' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 유저</SelectItem>
                  <SelectItem value="user">특정 유저</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {notifForm.target === 'user' && (
              <div>
                <Label>유저 ID</Label>
                <Input placeholder="유저 UUID" value={notifForm.userId} onChange={(e) => setNotifForm({ ...notifForm, userId: e.target.value })} />
              </div>
            )}
          </div>
          <div>
            <Label>제목</Label>
            <Input placeholder="알림 제목" value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} />
          </div>
          <div>
            <Label>내용</Label>
            <Input placeholder="알림 내용" value={notifForm.message} onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })} />
          </div>
          {notifResult && (
            <p className={`text-sm ${notifResult.startsWith('오류') ? 'text-red-600' : 'text-green-600'}`}>{notifResult}</p>
          )}
          <Button onClick={handleSendNotification} disabled={notifSending}>
            {notifSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            전송
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
