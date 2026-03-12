'use client';

import { useState } from 'react';
import { useOperatingExpenses, useDeleteOperatingExpense, EXPENSE_CATEGORIES, getCategoryName } from '@/lib/hooks/useOperatingExpenses';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Loader2, Wallet, Filter, Edit } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';

export default function OperatingExpensesPage() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    category: category || undefined,
  };

  const { data, isLoading, error } = useOperatingExpenses(page, 50, filters);
  const deleteExpense = useDeleteOperatingExpense();

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteExpense.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategory('');
    setPage(1);
  };

  const totalAmount = data?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0;

  const categoryTotals = data?.expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold">마진 계산기</Link>
            <nav className="hidden sm:flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">대시보드</Button>
              </Link>
              <Link href="/products">
                <Button variant="ghost" size="sm">상품 관리</Button>
              </Link>
              <Link href="/sales">
                <Button variant="ghost" size="sm">판매 기록</Button>
              </Link>
              <Link href="/expenses">
                <Button variant="ghost" size="sm">광고비</Button>
              </Link>
              <Link href="/expenses/operating">
                <Button variant="ghost" size="sm" className="bg-gray-100">운영비</Button>
              </Link>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">운영비 관리</h1>
            <p className="text-muted-foreground">포장비, 인건비, 창고비 등 운영비를 관리합니다</p>
          </div>
          <Link href="/expenses/operating/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              운영비 추가
            </Button>
          </Link>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 운영비</p>
                  <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">기록 수</p>
              <p className="text-2xl font-bold">{data?.pagination.total || 0}건</p>
            </CardContent>
          </Card>
        </div>

        {/* 카테고리별 요약 */}
        {Object.keys(categoryTotals).length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">카테고리별 지출</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(categoryTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => (
                    <div key={cat} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{getCategoryName(cat)}</p>
                      <p className="font-semibold">{formatCurrency(amount)}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 필터 */}
        <div className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            필터 {showFilters ? '숨기기' : '보기'}
          </Button>

          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">시작일</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">종료일</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">카테고리</label>
                    <select
                      className="w-full h-10 px-3 border rounded-md"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">전체</option>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters}>
                      필터 초기화
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              데이터를 불러오는데 실패했습니다
            </CardContent>
          </Card>
        ) : data?.expenses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">운영비 기록이 없습니다</p>
              <Link href="/expenses/operating/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  첫 운영비 추가하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {new Date(expense.expense_date).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getCategoryName(expense.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.description || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {expense.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/expenses/operating/${expense.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* 페이지네이션 */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              이전
            </Button>
            <span className="flex items-center px-4 text-sm">
              {page} / {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
            >
              다음
            </Button>
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>운영비 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 운영비 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
