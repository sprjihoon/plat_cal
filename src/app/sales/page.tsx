'use client';

import { useState } from 'react';
import { useSales, useDeleteSale } from '@/lib/hooks/useSales';
import { useProducts } from '@/lib/hooks/useProducts';
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
import { Plus, Trash2, Loader2, Receipt, Filter, Edit } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [channel, setChannel] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    channel: channel || undefined,
  };

  const { data, isLoading, error } = useSales(page, 50, filters);
  const deleteSale = useDeleteSale();

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteSale.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const getChannelName = (ch: string) => {
    return PLATFORM_PRESETS[ch as keyof typeof PLATFORM_PRESETS]?.name || ch;
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setChannel('');
    setPage(1);
  };

  // 요약 통계 계산
  const summary = data?.sales.reduce(
    (acc, sale) => ({
      totalRevenue: acc.totalRevenue + sale.total_revenue,
      totalProfit: acc.totalProfit + sale.net_profit,
      totalQuantity: acc.totalQuantity + sale.quantity,
    }),
    { totalRevenue: 0, totalProfit: 0, totalQuantity: 0 }
  ) || { totalRevenue: 0, totalProfit: 0, totalQuantity: 0 };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 헤더 */}
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
                <Button variant="ghost" size="sm" className="bg-gray-100">판매 기록</Button>
              </Link>
              <Link href="/expenses">
                <Button variant="ghost" size="sm">비용 관리</Button>
              </Link>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">판매 기록</h1>
            <p className="text-muted-foreground">일일 판매 내역을 기록하고 관리합니다</p>
          </div>
          <Link href="/sales/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              판매 기록 추가
            </Button>
          </Link>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">총 매출</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">총 순이익</p>
              <p className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.totalProfit)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">총 판매 수량</p>
              <p className="text-2xl font-bold">{summary.totalQuantity.toLocaleString()}개</p>
            </CardContent>
          </Card>
        </div>

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
                    <label className="text-sm font-medium">채널</label>
                    <select
                      className="w-full h-10 px-3 border rounded-md"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                    >
                      <option value="">전체</option>
                      {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                        <option key={key} value={key}>{preset.name}</option>
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

        {/* 판매 목록 */}
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
        ) : data?.sales.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">판매 기록이 없습니다</p>
              <Link href="/sales/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  첫 판매 기록 추가하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>상품</TableHead>
                    <TableHead>채널</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead className="text-right">단가</TableHead>
                    <TableHead className="text-right">매출</TableHead>
                    <TableHead className="text-right">순이익</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {new Date(sale.sale_date).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.products?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getChannelName(sale.channel)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {sale.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.unit_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.total_revenue)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${sale.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(sale.net_profit)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/sales/${sale.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(sale.id)}
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

            {/* 페이지네이션 */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  이전
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 삭제 확인 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>판매 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 판매 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
