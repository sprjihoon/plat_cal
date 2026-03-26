'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateOperatingExpense, EXPENSE_CATEGORIES } from '@/lib/hooks/useOperatingExpenses';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewOperatingExpensePage() {
  const router = useRouter();
  const createExpense = useCreateOperatingExpense();
  
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      await createExpense.mutateAsync({
        expense_date: expenseDate,
        category,
        amount: parseFloat(amount),
        description: description || null,
        notes: notes || null,
      });
      router.push('/expenses/operating');
    } catch (err) {
      setError('운영비 추가에 실패했습니다');
    }
  };

  return (
    <div className="bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-3 py-4 space-y-4 sm:px-4 sm:py-6 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/expenses/operating">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">운영비 추가</h1>
            <p className="text-muted-foreground">새로운 운영비를 기록합니다</p>
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
                  disabled={createExpense.isPending}
                >
                  {createExpense.isPending && (
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
