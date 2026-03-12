'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateOperatingExpense, EXPENSE_CATEGORIES } from '@/lib/hooks/useOperatingExpenses';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditOperatingExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const updateExpense = useUpdateOperatingExpense();
  
  const [loading, setLoading] = useState(true);
  const [expenseDate, setExpenseDate] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const res = await fetch(`/api/expenses/operating/${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setExpenseDate(data.expense_date);
        setCategory(data.category);
        setAmount(String(data.amount));
        setDescription(data.description || '');
        setNotes(data.notes || '');
      } catch (err) {
        setError('데이터를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchExpense();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!category) {
      setError('카테고리를 선택해주세요');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('금액을 입력해주세요');
      return;
    }

    try {
      await updateExpense.mutateAsync({
        id,
        expense_date: expenseDate,
        category,
        amount: parseFloat(amount),
        description: description || null,
        notes: notes || null,
      });
      router.push('/expenses/operating');
    } catch (err) {
      setError('수정에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold">마진 계산기</Link>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/expenses/operating">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">운영비 수정</h1>
            <p className="text-muted-foreground">운영비 기록을 수정합니다</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>운영비 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">날짜</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">금액</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <select
                  id="category"
                  className="w-full h-10 px-3 border rounded-md"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">카테고리 선택</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} - {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  placeholder="예: 3월 택배비"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">메모 (선택)</Label>
                <Textarea
                  id="notes"
                  placeholder="추가 메모"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateExpense.isPending}
                >
                  {updateExpense.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  저장
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
