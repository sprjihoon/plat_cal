'use client';

import { useState } from 'react';
import { useAdvertising, useDeleteAdvertising, calculateROAS, calculateCPC, calculateCTR, calculateCVR } from '@/lib/hooks/useExpenses';
import { useSales } from '@/lib/hooks/useSales';
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
import { Plus, Trash2, Loader2, TrendingUp, DollarSign, MousePointer, Target, Filter, Edit } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';
import { DateFilter } from '@/components/ui/date-filter';
import { Pagination, type PageSize } from '@/components/ui/pagination';

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(30);
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

  const { data: adData, isLoading, error } = useAdvertising(page, pageSize, filters);
  const { data: salesData } = useSales(1, 1000, filters);
  const deleteAd = useDeleteAdvertising();

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAd.mutateAsync(deleteId);
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
  const adSummary = adData?.advertising.reduce(
    (acc, ad) => ({
      totalCost: acc.totalCost + ad.cost,
      totalImpressions: acc.totalImpressions + ad.impressions,
      totalClicks: acc.totalClicks + ad.clicks,
      totalConversions: acc.totalConversions + ad.conversions,
    }),
    { totalCost: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0 }
  ) || { totalCost: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0 };

  const totalRevenue = salesData?.sales.reduce((sum, s) => sum + s.total_revenue, 0) || 0;
  const hasMetrics = adSummary.totalImpressions > 0 || adSummary.totalClicks > 0 || adSummary.totalConversions > 0;
  const roas = calculateROAS(totalRevenue, adSummary.totalCost);
  const cpc = calculateCPC(adSummary.totalCost, adSummary.totalClicks);
  const ctr = calculateCTR(adSummary.totalClicks, adSummary.totalImpressions);
  const cvr = calculateCVR(adSummary.totalConversions, adSummary.totalClicks);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">광고비 관리</h1>
            <p className="text-muted-foreground mt-1">광고비를 기록하고 ROI/ROAS를 분석합니다</p>
          </div>
          <Link href="/expenses/new">
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              광고비 기록 추가
            </Button>
          </Link>
        </div>

        {/* 핵심 지표 카드 */}
        <div className={`grid gap-4 ${hasMetrics ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
          <Card className="bg-[#8C9EFF]/12 ring-0 border-0">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#8C9EFF]/25 rounded-xl">
                  <DollarSign className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">총 광고비</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(adSummary.totalCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${roas >= 100 ? 'bg-[#D6F74C]/20' : 'bg-[#D6F74C]/15'} ring-0 border-0`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${roas >= 100 ? 'bg-[#D6F74C]/40' : 'bg-[#D6F74C]/30'}`}>
                  <TrendingUp className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">ROAS</p>
                  <p className="text-lg font-bold text-gray-900">
                    {roas.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {hasMetrics && (
            <>
              <Card className="bg-[#8C9EFF]/15 ring-0 border-0">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-[#8C9EFF]/30 rounded-xl">
                      <MousePointer className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">CPC (클릭당 비용)</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(cpc)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#D6F74C]/15 ring-0 border-0">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-[#D6F74C]/30 rounded-xl">
                      <Target className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">전환율 (CVR)</p>
                      <p className="text-lg font-bold text-gray-900">{cvr.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
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
                    <label className="text-sm font-medium">채널</label>
                    <select
                      className="w-full h-10 px-3 border rounded-md"
                      value={channel}
                      onChange={(e) => { setChannel(e.target.value); setPage(1); }}
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

        {/* 광고비 목록 */}
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
        ) : adData?.advertising.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">광고비 기록이 없습니다</p>
              <Link href="/expenses/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  첫 광고비 기록 추가하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 데스크톱 테이블 */}
            <Card className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>채널</TableHead>
                    <TableHead>캠페인</TableHead>
                    <TableHead className="text-right">광고비</TableHead>
                    {hasMetrics && (
                      <>
                        <TableHead className="text-right">클릭</TableHead>
                        <TableHead className="text-right">전환</TableHead>
                        <TableHead className="text-right">CPC</TableHead>
                      </>
                    )}
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adData?.advertising.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        {new Date(ad.ad_date).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getChannelName(ad.channel)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ad.campaign_name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(ad.cost)}
                      </TableCell>
                      {hasMetrics && (
                        <>
                          <TableCell className="text-right">
                            {ad.clicks > 0 ? ad.clicks.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {ad.conversions > 0 ? ad.conversions.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {ad.clicks > 0 ? formatCurrency(calculateCPC(ad.cost, ad.clicks)) : '-'}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/expenses/${ad.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(ad.id)}
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

            {/* 모바일 카드 뷰 */}
            <div className="sm:hidden space-y-3">
              {adData?.advertising.map((ad) => (
                <Card key={ad.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{getChannelName(ad.channel)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ad.ad_date).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        {ad.campaign_name && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">{ad.campaign_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Link href={`/expenses/${ad.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(ad.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className={`grid gap-2 mt-2 pt-2 border-t ${hasMetrics ? 'grid-cols-3' : 'grid-cols-1'}`}>
                      <div>
                        <p className="text-[10px] text-muted-foreground">광고비</p>
                        <p className="text-sm font-bold">{formatCurrency(ad.cost)}</p>
                      </div>
                      {hasMetrics && (
                        <>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">클릭 / 전환</p>
                            <p className="text-xs font-medium">
                              {ad.clicks > 0 ? ad.clicks.toLocaleString() : '-'} / {ad.conversions > 0 ? ad.conversions.toLocaleString() : '-'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">CPC</p>
                            <p className="text-xs font-medium">
                              {ad.clicks > 0 ? formatCurrency(calculateCPC(ad.cost, ad.clicks)) : '-'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {adData && (
              <Pagination
                page={page}
                totalPages={adData.pagination.totalPages}
                total={adData.pagination.total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            )}
          </>
        )}
      </main>

      {/* 삭제 확인 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>광고비 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 광고비 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
