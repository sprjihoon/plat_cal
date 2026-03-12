'use client';

import { useState } from 'react';
import { useAdvertising, useDeleteAdvertising, calculateROAS, calculateCPC, calculateCTR, calculateCVR } from '@/lib/hooks/useExpenses';
import { useSales } from '@/lib/hooks/useSales';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function ExpensesPage() {
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

  const { data: adData, isLoading, error } = useAdvertising(page, 50, filters);
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
  const roas = calculateROAS(totalRevenue, adSummary.totalCost);
  const cpc = calculateCPC(adSummary.totalCost, adSummary.totalClicks);
  const ctr = calculateCTR(adSummary.totalClicks, adSummary.totalImpressions);
  const cvr = calculateCVR(adSummary.totalConversions, adSummary.totalClicks);

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
                <Button variant="ghost" size="sm">판매 기록</Button>
              </Link>
              <Link href="/expenses">
                <Button variant="ghost" size="sm" className="bg-gray-100">비용 관리</Button>
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
            <h1 className="text-2xl font-bold">광고비 관리</h1>
            <p className="text-muted-foreground">광고비를 기록하고 ROI/ROAS를 분석합니다</p>
          </div>
          <Link href="/expenses/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              광고비 기록 추가
            </Button>
          </Link>
        </div>

        {/* 성과 지표 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 광고비</p>
                  <p className="text-xl font-bold">{formatCurrency(adSummary.totalCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${roas >= 100 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <TrendingUp className={`h-5 w-5 ${roas >= 100 ? 'text-green-600' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROAS</p>
                  <p className={`text-xl font-bold ${roas >= 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {roas.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MousePointer className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPC (클릭당 비용)</p>
                  <p className="text-xl font-bold">{formatCurrency(cpc)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">전환율 (CVR)</p>
                  <p className="text-xl font-bold">{cvr.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 추가 지표 */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">총 노출수</p>
                <p className="text-lg font-semibold">{adSummary.totalImpressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 클릭수</p>
                <p className="text-lg font-semibold">{adSummary.totalClicks.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CTR (클릭률)</p>
                <p className="text-lg font-semibold">{ctr.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 전환수</p>
                <p className="text-lg font-semibold">{adSummary.totalConversions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>채널</TableHead>
                  <TableHead>캠페인</TableHead>
                  <TableHead className="text-right">광고비</TableHead>
                  <TableHead className="text-right">노출</TableHead>
                  <TableHead className="text-right">클릭</TableHead>
                  <TableHead className="text-right">전환</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
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
                    <TableCell className="text-right">
                      {ad.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {ad.clicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {ad.conversions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(calculateCPC(ad.cost, ad.clicks))}
                    </TableCell>
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
