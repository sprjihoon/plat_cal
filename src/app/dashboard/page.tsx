'use client';

import { useState } from 'react';
import { useDashboard } from '@/lib/hooks/useDashboard';
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  BarChart3,
  Target,
  Wallet,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';
import { SalesChart, ChannelPieChart, BarChartComponent } from '@/components/charts';
import { useCurrentGoal } from '@/lib/hooks/useGoals';

const PERIOD_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '1주일' },
  { value: '2weeks', label: '2주일' },
  { value: 'month', label: '1개월' },
  { value: 'quarter', label: '분기' },
  { value: 'half', label: '반기' },
  { value: 'year', label: '1년' },
];

function ChangeIndicator({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) {
    return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /> 변동없음</span>;
  }
  if (value > 0) {
    return <span className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> +{value.toFixed(1)}%</span>;
  }
  return <span className="text-xs text-red-600 flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" /> {value.toFixed(1)}%</span>;
}

function GoalProgress({ label, current, target, unit = '' }: { label: string; current: number; target: number; unit?: string }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const color = pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{unit === '%' ? `${current.toFixed(1)}%` : formatCurrency(current)}</span>
        <span>목표: {unit === '%' ? `${target}%` : formatCurrency(target)}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('month');
  const { data, isLoading, error } = useDashboard(period);
  const { data: currentGoal } = useCurrentGoal();

  const getChannelName = (channel: string) => {
    return PLATFORM_PRESETS[channel as keyof typeof PLATFORM_PRESETS]?.name || channel;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">대시보드</h1>
            <p className="text-muted-foreground">매출, 비용, 수익을 한눈에 확인합니다</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={period === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

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
        ) : !data ? null : (
          <>
            {/* KPI 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">총 매출</p>
                      <p className="text-xl font-bold truncate">{formatCurrency(data.summary.revenue)}</p>
                      <ChangeIndicator value={data.changes.revenue} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Wallet className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">총 비용</p>
                      <p className="text-xl font-bold truncate">{formatCurrency(data.summary.totalCost)}</p>
                      <div className="text-xs text-muted-foreground">
                        광고 {formatCurrency(data.summary.adCost)} + 운영 {formatCurrency(data.summary.operatingCost)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${data.summary.netProfitAfterAll >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <TrendingUp className={`h-5 w-5 ${data.summary.netProfitAfterAll >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">순수익</p>
                      <p className={`text-xl font-bold truncate ${data.summary.netProfitAfterAll >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.summary.netProfitAfterAll)}
                      </p>
                      <ChangeIndicator value={data.changes.netProfitAfterAll} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">판매</p>
                      <p className="text-xl font-bold">{data.summary.salesCount.toLocaleString()}건</p>
                      <div className="text-xs text-muted-foreground">{data.summary.quantity.toLocaleString()}개 판매</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ROI / ROAS / 마진율 */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ROAS</p>
                    <p className={`text-2xl font-bold ${data.summary.roas >= 100 ? 'text-green-600' : data.summary.roas > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      {data.summary.adCost > 0 ? `${data.summary.roas.toFixed(0)}%` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">매출/광고비</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ROI</p>
                    <p className={`text-2xl font-bold ${data.summary.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.summary.totalCost > 0 ? `${data.summary.roi.toFixed(0)}%` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">(순이익-비용)/비용</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">마진율</p>
                    <p className={`text-2xl font-bold ${data.summary.marginRate >= 20 ? 'text-green-600' : data.summary.marginRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {data.summary.revenue > 0 ? `${data.summary.marginRate.toFixed(1)}%` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">순이익/매출</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">건당 평균 매출</p>
                    <p className="text-2xl font-bold">
                      {data.summary.salesCount > 0 ? formatCurrency(data.summary.revenue / data.summary.salesCount) : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">총매출/판매건수</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 목표 달성률 */}
            {currentGoal && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">목표 달성률</CardTitle>
                  <Link href="/goals">
                    <Button variant="ghost" size="sm">목표 관리</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {currentGoal.target_revenue > 0 && (
                      <GoalProgress
                        label="매출 목표"
                        current={data.summary.revenue}
                        target={currentGoal.target_revenue}
                      />
                    )}
                    {currentGoal.target_margin_rate > 0 && (
                      <GoalProgress
                        label="마진율 목표"
                        current={data.summary.marginRate}
                        target={currentGoal.target_margin_rate}
                        unit="%"
                      />
                    )}
                    {currentGoal.target_roas > 0 && (
                      <GoalProgress
                        label="ROAS 목표"
                        current={data.summary.roas}
                        target={currentGoal.target_roas}
                        unit="%"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 매출/비용 추이 차트 */}
            {data.dailyTrend.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>매출/수익 추이</CardTitle>
                </CardHeader>
                <CardContent>
                  <SalesChart
                    data={data.dailyTrend.map((d) => ({
                      date: d.date,
                      revenue: d.revenue,
                      profit: d.netProfit,
                    }))}
                  />
                </CardContent>
              </Card>
            )}

            {/* 비용 구조 + 채널별 매출 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 비용 구조 */}
              <Card>
                <CardHeader>
                  <CardTitle>비용 구조</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-red-600" />
                        <span className="font-medium">광고비</span>
                      </div>
                      <span className="font-bold text-red-600">{formatCurrency(data.summary.adCost)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">운영비</span>
                      </div>
                      <span className="font-bold text-orange-600">{formatCurrency(data.summary.operatingCost)}</span>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                      <span className="font-semibold">총 비용</span>
                      <span className="font-bold text-lg">{formatCurrency(data.summary.totalCost)}</span>
                    </div>
                    {data.summary.revenue > 0 && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>비용 비율 (비용/매출)</span>
                        <span>{((data.summary.totalCost / data.summary.revenue) * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 채널별 매출 */}
              {data.channelRevenue.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>채널별 매출</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.channelRevenue.length > 1 ? (
                      <ChannelPieChart
                        data={data.channelRevenue.map((ch) => ({
                          channel: ch.channel,
                          name: getChannelName(ch.channel),
                          value: ch.revenue,
                        }))}
                      />
                    ) : (
                      <div className="space-y-3">
                        {data.channelRevenue.map((ch) => (
                          <div key={ch.channel} className="flex items-center justify-between p-3 border rounded-lg">
                            <Badge variant="secondary">{getChannelName(ch.channel)}</Badge>
                            <span className="font-bold">{formatCurrency(ch.revenue)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 수익성 요약 테이블 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>수익성 요약</CardTitle>
                <div className="flex gap-2">
                  <Link href="/sales">
                    <Button variant="outline" size="sm">판매장부</Button>
                  </Link>
                  <Link href="/reports">
                    <Button variant="outline" size="sm">상세 리포트</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>항목</TableHead>
                        <TableHead className="text-right">금액</TableHead>
                        <TableHead className="text-right">매출 대비</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">총 매출</TableCell>
                        <TableCell className="text-right font-bold text-blue-600">{formatCurrency(data.summary.revenue)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">상품 순이익 (수수료 차감 후)</TableCell>
                        <TableCell className={`text-right ${data.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.summary.profit)}</TableCell>
                        <TableCell className="text-right">{data.summary.revenue > 0 ? `${(data.summary.profit / data.summary.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-red-600">(-) 광고비</TableCell>
                        <TableCell className="text-right text-red-600">-{formatCurrency(data.summary.adCost)}</TableCell>
                        <TableCell className="text-right">{data.summary.revenue > 0 ? `${(data.summary.adCost / data.summary.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-orange-600">(-) 운영비</TableCell>
                        <TableCell className="text-right text-orange-600">-{formatCurrency(data.summary.operatingCost)}</TableCell>
                        <TableCell className="text-right">{data.summary.revenue > 0 ? `${(data.summary.operatingCost / data.summary.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                      </TableRow>
                      <TableRow className="border-t-2 font-bold">
                        <TableCell>최종 순수익</TableCell>
                        <TableCell className={`text-right text-lg ${data.summary.netProfitAfterAll >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(data.summary.netProfitAfterAll)}
                        </TableCell>
                        <TableCell className="text-right">{data.summary.revenue > 0 ? `${(data.summary.netProfitAfterAll / data.summary.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 빠른 액션 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/sales/new">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-medium">판매 기록</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/expenses/new">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-red-600" />
                    <p className="font-medium">광고비 등록</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/expenses/operating/new">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <Wallet className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <p className="font-medium">운영비 등록</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/reports">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="font-medium">상세 리포트</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
