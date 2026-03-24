'use client';

import { useState } from 'react';
import { useGoals, useCreateGoal, useDeleteGoal } from '@/lib/hooks/useGoals';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Trash2, Loader2, Target, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { useDashboard } from '@/lib/hooks/useDashboard';

export default function GoalsPage() {
  const { data, isLoading, error: fetchError } = useGoals();
  const createGoal = useCreateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    period_start: new Date().toISOString().split('T')[0],
    period_end: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })(),
    target_revenue: '',
    target_margin_rate: '',
    target_roas: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const revenue = Number(form.target_revenue) || 0;
    const marginRate = Number(form.target_margin_rate) || 0;
    const roas = Number(form.target_roas) || 0;

    if (revenue === 0 && marginRate === 0 && roas === 0) {
      setError('매출, 마진율, ROAS 중 하나 이상 입력해주세요');
      return;
    }

    try {
      await createGoal.mutateAsync({
        period_start: form.period_start,
        period_end: form.period_end,
        target_revenue: revenue,
        target_margin_rate: marginRate,
        target_roas: roas,
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm({
        period_start: new Date().toISOString().split('T')[0],
        period_end: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })(),
        target_revenue: '', target_margin_rate: '', target_roas: '', notes: '',
      });
    } catch (err: any) {
      setError(err?.message || '목표 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const activeGoal = data?.goals.find((g) => g.period_start <= today && g.period_end >= today);
  const { data: dashData } = useDashboard(
    activeGoal
      ? { startDate: activeGoal.period_start, endDate: activeGoal.period_end }
      : { period: 'today' }
  );

  return (
    <div className="bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">목표 관리</h1>
            <p className="text-muted-foreground">매출, 마진율, ROAS 목표를 설정하고 추적합니다</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />새 목표
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>새 목표 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>시작일</Label>
                    <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} required />
                  </div>
                  <div>
                    <Label>종료일</Label>
                    <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>매출 목표 (원)</Label>
                    <Input type="number" placeholder="10000000" value={form.target_revenue} onChange={(e) => setForm({ ...form, target_revenue: e.target.value })} />
                  </div>
                  <div>
                    <Label>마진율 목표 (%)</Label>
                    <Input type="number" placeholder="20" value={form.target_margin_rate} onChange={(e) => setForm({ ...form, target_margin_rate: e.target.value })} />
                  </div>
                  <div>
                    <Label>ROAS 목표 (%)</Label>
                    <Input type="number" placeholder="300" value={form.target_roas} onChange={(e) => setForm({ ...form, target_roas: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>메모</Label>
                  <Input placeholder="목표에 대한 메모" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">{error}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={createGoal.isPending}>
                    {createGoal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    저장
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(null); }}>취소</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : fetchError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">목표 데이터를 불러올 수 없습니다</p>
              <p className="text-xs text-muted-foreground mb-4">Supabase에 goals 테이블이 생성되었는지 확인해주세요</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />첫 목표 설정하기
              </Button>
            </CardContent>
          </Card>
        ) : !data?.goals.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">설정된 목표가 없습니다</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />첫 목표 설정하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.goals.map((goal) => {
              const isActive = goal.period_start <= today && goal.period_end >= today;
              const isPast = goal.period_end < today;
              const endDate = new Date(goal.period_end);
              const remainDays = Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
              const summary = isActive && dashData ? dashData.summary : null;

              return (
                <Card key={goal.id} className={isActive ? 'ring-2 ring-primary' : ''}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {goal.period_start} ~ {goal.period_end}
                        </CardTitle>
                        {isActive && <Badge>진행 중</Badge>}
                        {isPast && <Badge variant="secondary">종료</Badge>}
                        {!isActive && !isPast && <Badge variant="outline">예정</Badge>}
                        {isActive && remainDays > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{remainDays}일 남음
                          </span>
                        )}
                      </div>
                      {goal.notes && <CardDescription>{goal.notes}</CardDescription>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(goal.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {summary && isActive ? (
                      <div className="space-y-4">
                        {goal.target_revenue > 0 && (
                          <GoalProgressBar
                            label="매출"
                            current={summary.revenue}
                            target={goal.target_revenue}
                            remainDays={remainDays}
                          />
                        )}
                        {goal.target_margin_rate > 0 && (
                          <GoalProgressBar
                            label="마진율"
                            current={summary.marginRate}
                            target={goal.target_margin_rate}
                            unit="%"
                            remainDays={remainDays}
                          />
                        )}
                        {goal.target_roas > 0 && (
                          <GoalProgressBar
                            label="ROAS"
                            current={summary.roas}
                            target={goal.target_roas}
                            unit="%"
                            remainDays={remainDays}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">매출 목표</p>
                          <p className="text-lg font-bold">{goal.target_revenue > 0 ? formatCurrency(goal.target_revenue) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">마진율 목표</p>
                          <p className="text-lg font-bold">{goal.target_margin_rate > 0 ? `${goal.target_margin_rate}%` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ROAS 목표</p>
                          <p className="text-lg font-bold">{goal.target_roas > 0 ? `${goal.target_roas}%` : '-'}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>목표 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 목표를 삭제하시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (deleteId) await deleteGoalMutation.mutateAsync(deleteId);
                setDeleteId(null);
              }}
            >삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GoalProgressBar({ label, current, target, unit, remainDays }: { label: string; current: number; target: number; unit?: string; remainDays: number }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const achieved = pct >= 100;
  const gap = target - current;
  const isPercent = unit === '%';
  const dailyNeeded = remainDays > 0 && gap > 0 ? gap / remainDays : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {achieved ? (
            <Badge className="bg-[#8C9EFF]/20 text-[#4a5abf] border-0 text-xs">달성!</Badge>
          ) : (
            <span className={`text-sm font-bold ${pct >= 70 ? 'text-[#5a6abf]' : 'text-amber-600'}`}>{pct.toFixed(0)}%</span>
          )}
        </div>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${achieved ? 'bg-[#8C9EFF]' : 'bg-gradient-to-r from-[#8C9EFF] to-[#6b7fef]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>현재 {isPercent ? `${current.toFixed(1)}%` : formatCurrency(current)}</span>
        <span>목표 {isPercent ? `${target}%` : formatCurrency(target)}</span>
      </div>
      {!achieved && gap > 0 && (
        <div className="bg-muted/60 rounded-lg p-2.5 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">부족</span>
            <span className="font-semibold text-amber-600">
              {isPercent ? `${gap.toFixed(1)}%p` : formatCurrency(gap)}
            </span>
          </div>
          {!isPercent && dailyNeeded > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">일평균 필요</span>
              <span className="font-medium">{formatCurrency(dailyNeeded)}/일</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
