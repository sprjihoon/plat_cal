'use client';

import { useState } from 'react';
import { useReport, getDateRange } from '@/lib/hooks/useReports';
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
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Target,
  BarChart3,
  FileText,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';
import { SalesChart, ChannelPieChart, BarChartComponent } from '@/components/charts';

type GroupBy = 'day' | 'week' | 'month';

export default function ReportsPage() {
  const initialRange = getDateRange('month');
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');

  const { data, isLoading, error } = useReport({ startDate, endDate, groupBy });

  const handlePreset = (preset: string) => {
    const range = getDateRange(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const getChannelName = (ch: string) => {
    return PLATFORM_PRESETS[ch as keyof typeof PLATFORM_PRESETS]?.name || ch;
  };

  const formatPeriod = (period: string) => {
    if (groupBy === 'month') {
      const [year, month] = period.split('-');
      return `${year}년 ${month}월`;
    }
    return new Date(period).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExport = (type: string) => {
    const params = new URLSearchParams({
      type,
      startDate,
      endDate,
      format: 'csv',
    });
    window.open(`/api/export?${params}`, '_blank');
  };

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
                <Button variant="ghost" size="sm">비용 관리</Button>
              </Link>
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="bg-gray-100">결산 리포트</Button>
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
            <h1 className="text-2xl font-bold">결산 리포트</h1>
            <p className="text-muted-foreground">기간별 매출, 수익, 광고비를 분석합니다</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('sales')}>
              <Download className="h-4 w-4 mr-2" />
              판매 내보내기
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('advertising')}>
              <Download className="h-4 w-4 mr-2" />
              광고비 내보내기
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('report')}>
              <Download className="h-4 w-4 mr-2" />
              리포트 내보내기
            </Button>
          </div>
        </div>

        {/* 기간 선택 */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePreset('today')}>오늘</Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset('yesterday')}>어제</Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset('week')}>최근 7일</Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset('month')}>최근 30일</Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset('thisMonth')}>이번 달</Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset('lastMonth')}>지난 달</Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset('quarter')}>최근 3개월</Button>
            </div>

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
                <label className="text-sm font-medium">집계 단위</label>
                <select
                  className="w-full h-10 px-3 border rounded-md"
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                >
                  <option value="day">일별</option>
                  <option value="week">주별</option>
                  <option value="month">월별</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

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
        ) : !data ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">기간을 선택하세요</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 전체 요약 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">총 매출</p>
                      <p className="text-xl font-bold">{formatCurrency(data.totalSummary.revenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${data.totalSummary.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <TrendingUp className={`h-5 w-5 ${data.totalSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">총 순이익</p>
                      <p className={`text-xl font-bold ${data.totalSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.totalSummary.profit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Target className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">총 광고비</p>
                      <p className="text-xl font-bold">{formatCurrency(data.totalSummary.adCost)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${data.totalSummary.netProfitAfterAd >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <BarChart3 className={`h-5 w-5 ${data.totalSummary.netProfitAfterAd >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">광고 후 순이익</p>
                      <p className={`text-xl font-bold ${data.totalSummary.netProfitAfterAd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.totalSummary.netProfitAfterAd)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 추가 지표 */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">총 판매 건수</p>
                    <p className="text-lg font-semibold">{data.totalSummary.salesCount.toLocaleString()}건</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">총 판매 수량</p>
                    <p className="text-lg font-semibold">{data.totalSummary.quantity.toLocaleString()}개</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS</p>
                    <p className={`text-lg font-semibold ${data.totalSummary.roas >= 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {data.totalSummary.roas.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className={`text-lg font-semibold ${data.totalSummary.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.totalSummary.roi.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">광고 전환수</p>
                    <p className="text-lg font-semibold">{data.totalSummary.conversions.toLocaleString()}건</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 매출/이익 추이 차트 */}
            {data.periodSummaries.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>매출/이익 추이</CardTitle>
                </CardHeader>
                <CardContent>
                  <SalesChart
                    data={data.periodSummaries.map((p) => ({
                      date: p.period,
                      revenue: p.revenue,
                      profit: p.profit,
                    }))}
                  />
                </CardContent>
              </Card>
            )}

            {/* 채널별 차트 */}
            {data.channelSummary.length > 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>채널별 매출 비중</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChannelPieChart
                      data={data.channelSummary.map((ch) => ({
                        channel: ch.channel,
                        name: getChannelName(ch.channel),
                        value: ch.revenue,
                      }))}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>채널별 매출/이익</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChartComponent
                      data={data.channelSummary.map((ch) => ({
                        name: getChannelName(ch.channel),
                        revenue: ch.revenue,
                        profit: ch.profit,
                      }))}
                      bars={[
                        { dataKey: 'revenue', name: '매출', color: '#3b82f6' },
                        { dataKey: 'profit', name: '순이익', color: '#22c55e' },
                      ]}
                      layout="vertical"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 채널별 요약 */}
            {data.channelSummary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>채널별 실적</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.channelSummary.map((ch) => (
                      <div key={ch.channel} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary">{getChannelName(ch.channel)}</Badge>
                          <span className="text-sm text-muted-foreground">{ch.count}건</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">매출</span>
                            <span className="font-medium">{formatCurrency(ch.revenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">순이익</span>
                            <span className={`font-medium ${ch.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(ch.profit)}
                            </span>
                          </div>
                          {ch.adCost !== undefined && ch.adCost > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">광고비</span>
                              <span className="font-medium text-red-600">-{formatCurrency(ch.adCost)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 기간별 상세 */}
            {data.periodSummaries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{groupBy === 'day' ? '일별' : groupBy === 'week' ? '주별' : '월별'} 상세</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>기간</TableHead>
                      <TableHead className="text-right">매출</TableHead>
                      <TableHead className="text-right">순이익</TableHead>
                      <TableHead className="text-right">광고비</TableHead>
                      <TableHead className="text-right">광고 후 이익</TableHead>
                      <TableHead className="text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.periodSummaries.map((period) => (
                      <TableRow key={period.period}>
                        <TableCell className="font-medium">
                          {formatPeriod(period.period)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(period.revenue)}
                        </TableCell>
                        <TableCell className={`text-right ${period.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(period.profit)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {period.adCost > 0 ? `-${formatCurrency(period.adCost)}` : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${period.netProfitAfterAd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(period.netProfitAfterAd)}
                        </TableCell>
                        <TableCell className={`text-right ${period.roas >= 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {period.adCost > 0 ? `${period.roas.toFixed(0)}%` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
