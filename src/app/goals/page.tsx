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
import { ArrowLeft, Plus, Trash2, Loader2, Target } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';

export default function GoalsPage() {
  const { data, isLoading } = useGoals();
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

  return (
    <div className="min-h-screen bg-background">
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
                      </div>
                      {goal.notes && <CardDescription>{goal.notes}</CardDescription>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(goal.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardHeader>
                  <CardContent>
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
