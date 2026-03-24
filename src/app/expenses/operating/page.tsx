'use client';

import { useState } from 'react';
import { useOperatingExpenses, useDeleteOperatingExpense, EXPENSE_CATEGORIES, getCategoryName } from '@/lib/hooks/useOperatingExpenses';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
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
import { DateFilter } from '@/components/ui/date-filter';
import { Pagination, type PageSize } from '@/components/ui/pagination';

export default function OperatingExpensesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(30);
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

  const { data, isLoading, error } = useOperatingExpenses(page, pageSize, filters);
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
    <div className="bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">운영비 관리</h1>
            <p className="text-muted-foreground mt-1">포장비, 인건비, 창고비 등 운영비를 관리합니다</p>
          </div>
          <Link href="/expenses/operating/new">
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              운영비 추가
            </Button>
          </Link>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#8C9EFF]/15 ring-0 border-0">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#8C9EFF]/30 rounded-xl">
                  <Wallet className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">총 운영비</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#D6F74C]/15 ring-0 border-0">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-gray-500 mb-1">기록 수</p>
              <p className="text-lg font-bold text-gray-900">{data?.pagination.total || 0}건</p>
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
                    <div key={cat} className="p-3.5 bg-muted/40 rounded-xl">
                      <p className="text-xs font-medium text-muted-foreground">{getCategoryName(cat)}</p>
                      <p className="font-semibold mt-0.5">{formatCurrency(amount)}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 날짜 필터 */}
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(d) => { setStartDate(d); setPage(1); }}
          onEndDateChange={(d) => { setEndDate(d); setPage(1); }}
        />

        {/* 추가 필터 */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">카테고리</label>
                    <select
                      className="w-full h-10 px-3 border rounded-md"
                      value={category}
                      onChange={(e) => { setCategory(e.target.value); setPage(1); }}
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

        {data && (
          <Pagination
            page={page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
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
