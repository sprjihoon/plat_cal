'use client';

import { useState } from 'react';
import { useSettlements, useCreateSettlement, useUpdateSettlement, useDeleteSettlement } from '@/lib/hooks/useSettlements';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';

const CYCLE_OPTIONS = [
  { value: 'weekly', label: '주 1회' },
  { value: 'biweekly', label: '월 2회' },
  { value: 'monthly', label: '월 1회' },
  { value: 'custom', label: '직접 설정' },
];

export default function SettlementsPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const { data, isLoading } = useSettlements(currentMonth);
  const createSettlement = useCreateSettlement();
  const updateSettlement = useUpdateSettlement();
  const deleteSettlementMutation = useDeleteSettlement();

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    channel: 'smartstore',
    settlement_cycle: 'biweekly',
    next_settlement_date: '',
    expected_amount: '',
    notes: '',
  });

  const navigateMonth = (dir: number) => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSettlement.mutateAsync({
      channel: form.channel,
      settlement_cycle: form.settlement_cycle,
      next_settlement_date: form.next_settlement_date || null,
      expected_amount: Number(form.expected_amount) || 0,
      notes: form.notes || null,
    });
    setShowForm(false);
    setForm({ channel: 'smartstore', settlement_cycle: 'biweekly', next_settlement_date: '', expected_amount: '', notes: '' });
  };

  const handleConfirm = async (id: string, actualAmount: number) => {
    await updateSettlement.mutateAsync({
      id,
      data: { is_confirmed: true, actual_amount: actualAmount },
    });
  };

  const getChannelName = (ch: string) =>
    PLATFORM_PRESETS[ch as keyof typeof PLATFORM_PRESETS]?.name || ch;

  const todayStr = today.toISOString().split('T')[0];
  const [year, month] = currentMonth.split('-').map(Number);
  const monthLabel = `${year}년 ${month}월`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();

  const settlementsByDate: Record<string, any[]> = {};
  data?.settlements.forEach((s) => {
    if (s.next_settlement_date) {
      if (!settlementsByDate[s.next_settlement_date]) settlementsByDate[s.next_settlement_date] = [];
      settlementsByDate[s.next_settlement_date].push(s);
    }
  });

  const totalExpected = data?.settlements.reduce((s, item) => s + item.expected_amount, 0) || 0;
  const totalConfirmed = data?.settlements.filter((s) => s.is_confirmed).reduce((s, item) => s + (item.actual_amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">정산 캘린더</h1>
            <p className="text-muted-foreground">마켓별 정산 일정과 입금을 관리합니다</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />정산 일정
          </Button>
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">예상 정산액</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(totalExpected)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">확인된 입금</p>
              <p className="text-xl font-bold text-[#6b7a1a]">{formatCurrency(totalConfirmed)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">정산 건수</p>
              <p className="text-xl font-bold">{data?.settlements.length || 0}건</p>
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <Card>
            <CardHeader><CardTitle>정산 일정 추가</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <Label>채널</Label>
                    <select className="w-full h-10 px-3 border rounded-md" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                      {Object.entries(PLATFORM_PRESETS).filter(([k]) => k !== 'custom').map(([key, p]) => (
                        <option key={key} value={key}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>정산 주기</Label>
                    <select className="w-full h-10 px-3 border rounded-md" value={form.settlement_cycle} onChange={(e) => setForm({ ...form, settlement_cycle: e.target.value })}>
                      {CYCLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>정산 예정일</Label>
                    <Input type="date" value={form.next_settlement_date} onChange={(e) => setForm({ ...form, next_settlement_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>예상 금액</Label>
                    <Input type="number" placeholder="0" value={form.expected_amount} onChange={(e) => setForm({ ...form, expected_amount: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>메모</Label>
                  <Input placeholder="메모" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createSettlement.isPending}>
                    {createSettlement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}저장
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>취소</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 캘린더 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle>{monthLabel}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                  <div key={d} className="bg-gray-50 p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
                ))}
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const daySettlements = settlementsByDate[dateStr] || [];
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={day} className={`bg-white p-2 min-h-[80px] ${isToday ? 'ring-2 ring-inset ring-blue-500' : ''}`}>
                      <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</span>
                      <div className="mt-1 space-y-1">
                        {daySettlements.map((s) => (
                          <div
                            key={s.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer ${
                              s.is_confirmed ? 'bg-[#D6F74C]/15 text-[#6b7a1a]' : 'bg-blue-100 text-blue-800'
                            }`}
                            title={`${getChannelName(s.channel)} - ${formatCurrency(s.expected_amount)}`}
                          >
                            {s.is_confirmed ? <CheckCircle className="h-3 w-3 inline mr-0.5" /> : <Clock className="h-3 w-3 inline mr-0.5" />}
                            {getChannelName(s.channel)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 정산 목록 */}
        {data && data.settlements.length > 0 && (
          <Card>
            <CardHeader><CardTitle>정산 일정 목록</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.settlements.map((s) => (
                  <div key={s.id} className={`flex items-center justify-between p-3 border rounded-lg ${s.is_confirmed ? 'bg-[#D6F74C]/10 border-[#D6F74C]/30' : ''}`}>
                    <div className="flex items-center gap-3">
                      {s.is_confirmed ? (
                        <CheckCircle className="h-5 w-5 text-[#6b7a1a]" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-600" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{getChannelName(s.channel)}</Badge>
                          <span className="text-sm">{s.next_settlement_date || '미정'}</span>
                          <Badge variant="outline" className="text-xs">
                            {CYCLE_OPTIONS.find((c) => c.value === s.settlement_cycle)?.label || s.settlement_cycle}
                          </Badge>
                        </div>
                        {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(s.expected_amount)}</p>
                        {s.is_confirmed && s.actual_amount !== null && (
                          <p className="text-xs text-[#6b7a1a]">실제: {formatCurrency(s.actual_amount)}</p>
                        )}
                      </div>
                      {!s.is_confirmed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfirm(s.id, s.expected_amount)}
                        >
                          확인
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정산 일정 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 정산 일정을 삭제하시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (deleteId) await deleteSettlementMutation.mutateAsync(deleteId);
                setDeleteId(null);
              }}
            >삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
