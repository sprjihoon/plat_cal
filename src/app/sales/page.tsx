'use client';

import { useState, useMemo } from 'react';
import { useSales, useDeleteSale } from '@/lib/hooks/useSales';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Trash2, Loader2, Receipt, Filter, Edit, LayoutList, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';
import { useUpdateSale } from '@/lib/hooks/useSales';
import type { SaleStatus } from '@/types/database';
import { DateFilter } from '@/components/ui/date-filter';
import { Pagination, type PageSize } from '@/components/ui/pagination';

type ViewMode = 'list' | 'daily';

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [channel, setChannel] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const updateSale = useUpdateSale();

  const filters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    channel: channel || undefined,
    status: statusFilter || undefined,
  };

  const { data, isLoading, error } = useSales(page, pageSize, filters);
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
    setStatusFilter('');
    setPage(1);
  };

  const handleStatusChange = async (saleId: string, newStatus: SaleStatus) => {
    await updateSale.mutateAsync({ id: saleId, data: { status: newStatus } });
  };

  const summary = data?.sales.reduce(
    (acc, sale) => ({
      totalRevenue: acc.totalRevenue + sale.total_revenue,
      totalProfit: acc.totalProfit + sale.net_profit,
      totalQuantity: acc.totalQuantity + sale.quantity,
    }),
    { totalRevenue: 0, totalProfit: 0, totalQuantity: 0 }
  ) || { totalRevenue: 0, totalProfit: 0, totalQuantity: 0 };

  const dailySummary = useMemo(() => {
    if (!data?.sales) return [];
    const grouped: Record<string, {
      date: string;
      revenue: number;
      profit: number;
      quantity: number;
      count: number;
      channels: Record<string, number>;
      sales: typeof data.sales;
    }> = {};

    data.sales.forEach((sale) => {
      const d = sale.sale_date;
      if (!grouped[d]) {
        grouped[d] = { date: d, revenue: 0, profit: 0, quantity: 0, count: 0, channels: {}, sales: [] };
      }
      grouped[d].revenue += sale.total_revenue;
      grouped[d].profit += sale.net_profit;
      grouped[d].quantity += sale.quantity;
      grouped[d].count += 1;
      grouped[d].channels[sale.channel] = (grouped[d].channels[sale.channel] || 0) + sale.total_revenue;
      grouped[d].sales.push(sale);
    });

    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  }, [data?.sales]);

  const marginRate = summary.totalRevenue > 0 ? (summary.totalProfit / summary.totalRevenue * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">판매장부</h1>
            <p className="text-muted-foreground mt-1">일일 판매 내역을 기록하고 관리합니다</p>
          </div>
          <div className="flex gap-2">
            <div className="flex border rounded-xl overflow-hidden">
              <Button
                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('daily')}
              >
                <CalendarDays className="h-4 w-4 mr-1" />일별
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="h-4 w-4 mr-1" />목록
              </Button>
            </div>
            <Link href="/sales/new">
              <Button className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />판매 기록
              </Button>
            </Link>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#D6F74C]/20 ring-0 border-0">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">총 매출</p>
              <p className="text-lg font-bold text-[#3d5800]">{formatCurrency(summary.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className={`${summary.totalProfit >= 0 ? 'bg-[#D6F74C]/15' : 'bg-[#F06038]/10'} ring-0 border-0`}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">총 순이익</p>
              <p className={`text-lg font-bold ${summary.totalProfit >= 0 ? 'text-[#4a6b00]' : 'text-[#c04020]'}`}>
                {formatCurrency(summary.totalProfit)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#8C9EFF]/15 ring-0 border-0">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">판매 수량</p>
              <p className="text-lg font-bold text-[#2d3a8c]">{summary.totalQuantity.toLocaleString()}개</p>
            </CardContent>
          </Card>
          <Card className="bg-[#FCD9BE]/30 ring-0 border-0">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">마진율</p>
              <p className={`text-lg font-bold ${marginRate >= 20 ? 'text-[#8c4d1a]' : marginRate >= 10 ? 'text-[#b06020]' : 'text-[#F06038]'}`}>
                {summary.totalRevenue > 0 ? `${marginRate.toFixed(1)}%` : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 날짜 필터 */}
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(d) => { setStartDate(d); setPage(1); }}
          onEndDateChange={(d) => { setEndDate(d); setPage(1); }}
        />

        {/* 추가 필터 */}
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />필터 {showFilters ? '숨기기' : '보기'}
          </Button>

          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">채널</label>
                    <select className="w-full h-10 px-3 border rounded-md" value={channel} onChange={(e) => { setChannel(e.target.value); setPage(1); }}>
                      <option value="">전체</option>
                      {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                        <option key={key} value={key}>{preset.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">상태</label>
                    <select className="w-full h-10 px-3 border rounded-md" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                      <option value="">전체</option>
                      <option value="completed">완료</option>
                      <option value="returned">반품</option>
                      <option value="cancelled">취소</option>
                      <option value="exchanged">교환</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters}>필터 초기화</Button>
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
          <Card><CardContent className="py-12 text-center text-muted-foreground">데이터를 불러오는데 실패했습니다</CardContent></Card>
        ) : data?.sales.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">판매 기록이 없습니다</p>
              <Link href="/sales/new">
                <Button><Plus className="h-4 w-4 mr-2" />첫 판매 기록 추가하기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : viewMode === 'daily' ? (
          /* 일별 요약 뷰 */
          <div className="space-y-4">
            {dailySummary.map((day) => (
              <Card key={day.date}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">
                        {new Date(day.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                      </CardTitle>
                      <Badge variant="secondary">{day.count}건</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">매출 </span>
                        <span className="font-bold">{formatCurrency(day.revenue)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">이익 </span>
                        <span className={`font-bold ${day.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(day.profit)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">수량 </span>
                        <span className="font-bold">{day.quantity}개</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>상품</TableHead>
                        <TableHead>채널</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-right">수량</TableHead>
                        <TableHead className="text-right">단가</TableHead>
                        <TableHead className="text-right">매출</TableHead>
                        <TableHead className="text-right">순이익</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {day.sales.map((sale) => (
                        <TableRow key={sale.id} className={(sale as any).status === 'returned' || (sale as any).status === 'cancelled' ? 'opacity-60' : ''}>
                          <TableCell className="font-medium">{sale.products?.name || '-'}</TableCell>
                          <TableCell><Badge variant="secondary">{getChannelName(sale.channel)}</Badge></TableCell>
                          <TableCell>
                            <select
                              className="text-xs border rounded px-1 py-0.5"
                              value={(sale as any).status || 'completed'}
                              onChange={(e) => handleStatusChange(sale.id, e.target.value as SaleStatus)}
                            >
                              <option value="completed">완료</option>
                              <option value="returned">반품</option>
                              <option value="cancelled">취소</option>
                              <option value="exchanged">교환</option>
                            </select>
                          </TableCell>
                          <TableCell className="text-right">{sale.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{formatCurrency(sale.unit_price)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(sale.total_revenue)}</TableCell>
                          <TableCell className={`text-right font-medium ${sale.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(sale.net_profit)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Link href={`/sales/${sale.id}/edit`}>
                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                              </Link>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(sale.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* 기존 목록 뷰 */
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>상품</TableHead>
                    <TableHead>채널</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead className="text-right">단가</TableHead>
                    <TableHead className="text-right">매출</TableHead>
                    <TableHead className="text-right">순이익</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.sales.map((sale) => (
                    <TableRow key={sale.id} className={(sale as any).status === 'returned' || (sale as any).status === 'cancelled' ? 'opacity-60' : ''}>
                      <TableCell>{new Date(sale.sale_date).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell className="font-medium">{sale.products?.name || '-'}</TableCell>
                      <TableCell><Badge variant="secondary">{getChannelName(sale.channel)}</Badge></TableCell>
                      <TableCell>
                        <select
                          className="text-xs border rounded px-1 py-0.5"
                          value={(sale as any).status || 'completed'}
                          onChange={(e) => handleStatusChange(sale.id, e.target.value as SaleStatus)}
                        >
                          <option value="completed">완료</option>
                          <option value="returned">반품</option>
                          <option value="cancelled">취소</option>
                          <option value="exchanged">교환</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">{sale.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.total_revenue)}</TableCell>
                      <TableCell className={`text-right font-medium ${sale.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(sale.net_profit)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/sales/${sale.id}/edit`}>
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(sale.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

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
          </>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>판매 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 판매 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
