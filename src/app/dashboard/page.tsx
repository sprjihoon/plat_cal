'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateFilter, getToday } from '@/components/ui/date-filter';
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
import { SalesChart, ChannelPieChart } from '@/components/charts';
import { useCurrentGoal } from '@/lib/hooks/useGoals';

function ChangeIndicator({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
        <Minus className="h-3 w-3" /> 변동없음
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <ArrowUpRight className="h-3 w-3" /> +{value.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
      <ArrowDownRight className="h-3 w-3" /> {value.toFixed(1)}%
    </span>
  );
}

function GoalProgress({ label, current, target, unit = '', color }: { label: string; current: number; target: number; unit?: string; color: string }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`font-bold ${pct >= 100 ? 'text-emerald-600' : pct >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{unit === '%' ? `${current.toFixed(1)}%` : formatCurrency(current)}</span>
        <span>목표: {unit === '%' ? `${target}%` : formatCurrency(target)}</span>
      </div>
    </div>
  );
}

const KPI_STYLES = [
  { bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', accent: 'text-blue-700' },
  { bg: 'bg-rose-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', accent: 'text-rose-700' },
  { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', accent: 'text-emerald-700' },
  { bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', accent: 'text-violet-700' },
];

export default function DashboardPage() {
  const today = getToday();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [userName, setUserName] = useState('');
  const { data, isLoading, error } = useDashboard({ startDate, endDate });
  const { data: currentGoal } = useCurrentGoal();

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.ok ? res.json() : null)
      .then(profile => { if (profile?.name) setUserName(profile.name); })
      .catch(() => {});
  }, []);

  const getChannelName = (channel: string) => {
    return PLATFORM_PRESETS[channel as keyof typeof PLATFORM_PRESETS]?.name || channel;
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '좋은 오후예요' : '좋은 저녁이에요';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          {userName ? (
            <h1 className="text-2xl font-bold tracking-tight">
              {userName} 대표님, {greeting} 👋
            </h1>
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
          )}
          <p className="text-muted-foreground mt-1">매출, 비용, 수익을 한눈에 확인합니다</p>
        </div>

        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          defaultQuick={0}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              데이터를 불러오는데 실패했습니다
            </CardContent>
          </Card>
        ) : !data ? null : (
          <>
            {/* KPI 카드 - 파스텔 컬러풀 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className={`${KPI_STYLES[0].bg} ring-0 border-0`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 ${KPI_STYLES[0].iconBg} rounded-xl`}>
                      <DollarSign className={`h-5 w-5 ${KPI_STYLES[0].iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">총 매출</p>
                      <p className={`text-lg font-bold truncate ${KPI_STYLES[0].accent}`}>{formatCurrency(data.summary.revenue)}</p>
                      <div className="mt-1.5"><ChangeIndicator value={data.changes.revenue} /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`${KPI_STYLES[1].bg} ring-0 border-0`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 ${KPI_STYLES[1].iconBg} rounded-xl`}>
                      <Wallet className={`h-5 w-5 ${KPI_STYLES[1].iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">총 비용</p>
                      <p className={`text-lg font-bold truncate ${KPI_STYLES[1].accent}`}>{formatCurrency(data.summary.totalCost)}</p>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        광고 {formatCurrency(data.summary.adCost)} + 운영 {formatCurrency(data.summary.operatingCost)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`${data.summary.netProfitAfterAll >= 0 ? KPI_STYLES[2].bg : KPI_STYLES[1].bg} ring-0 border-0`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 ${data.summary.netProfitAfterAll >= 0 ? KPI_STYLES[2].iconBg : KPI_STYLES[1].iconBg} rounded-xl`}>
                      <TrendingUp className={`h-5 w-5 ${data.summary.netProfitAfterAll >= 0 ? KPI_STYLES[2].iconColor : KPI_STYLES[1].iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">순수익</p>
                      <p className={`text-lg font-bold truncate ${data.summary.netProfitAfterAll >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(data.summary.netProfitAfterAll)}
                      </p>
                      <div className="mt-1.5"><ChangeIndicator value={data.changes.netProfitAfterAll} /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`${KPI_STYLES[3].bg} ring-0 border-0`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 ${KPI_STYLES[3].iconBg} rounded-xl`}>
                      <ShoppingCart className={`h-5 w-5 ${KPI_STYLES[3].iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">판매</p>
                      <p className={`text-lg font-bold ${KPI_STYLES[3].accent}`}>{data.summary.salesCount.toLocaleString()}건</p>
                      <p className="text-[11px] text-muted-foreground mt-1.5">{data.summary.quantity.toLocaleString()}개 판매</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 핵심 지표 - 파스텔 태그 스타일 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-teal-50 rounded-2xl p-4 text-center">
                <p className="text-xs font-medium text-teal-600 mb-1">ROAS</p>
                <p className={`text-2xl font-bold ${data.summary.roas >= 100 ? 'text-teal-700' : data.summary.roas > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {data.summary.adCost > 0 ? `${data.summary.roas.toFixed(0)}%` : '-'}
                </p>
                <p className="text-[11px] text-teal-600/70 mt-0.5">매출/광고비</p>
              </div>
              <div className="bg-sky-50 rounded-2xl p-4 text-center">
                <p className="text-xs font-medium text-sky-600 mb-1">ROI</p>
                <p className={`text-2xl font-bold ${data.summary.roi >= 0 ? 'text-sky-700' : 'text-rose-600'}`}>
                  {data.summary.totalCost > 0 ? `${data.summary.roi.toFixed(0)}%` : '-'}
                </p>
                <p className="text-[11px] text-sky-600/70 mt-0.5">(순이익-비용)/비용</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 text-center">
                <p className="text-xs font-medium text-amber-600 mb-1">마진율</p>
                <p className={`text-2xl font-bold ${data.summary.marginRate >= 20 ? 'text-amber-700' : data.summary.marginRate >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {data.summary.revenue > 0 ? `${data.summary.marginRate.toFixed(1)}%` : '-'}
                </p>
                <p className="text-[11px] text-amber-600/70 mt-0.5">순이익/매출</p>
              </div>
              <div className="bg-fuchsia-50 rounded-2xl p-4 text-center">
                <p className="text-xs font-medium text-fuchsia-600 mb-1">건당 평균</p>
                <p className="text-2xl font-bold text-fuchsia-700">
                  {data.summary.salesCount > 0 ? formatCurrency(data.summary.revenue / data.summary.salesCount) : '-'}
                </p>
                <p className="text-[11px] text-fuchsia-600/70 mt-0.5">총매출/판매건수</p>
              </div>
            </div>

            {/* 목표 달성률 */}
            {currentGoal && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">목표 달성률</CardTitle>
                  <Link href="/goals">
                    <Button variant="ghost" size="sm" className="text-primary">목표 관리</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {currentGoal.target_revenue > 0 && (
                      <GoalProgress
                        label="매출 목표"
                        current={data.summary.revenue}
                        target={currentGoal.target_revenue}
                        color="bg-gradient-to-r from-blue-400 to-blue-500"
                      />
                    )}
                    {currentGoal.target_margin_rate > 0 && (
                      <GoalProgress
                        label="마진율 목표"
                        current={data.summary.marginRate}
                        target={currentGoal.target_margin_rate}
                        unit="%"
                        color="bg-gradient-to-r from-emerald-400 to-emerald-500"
                      />
                    )}
                    {currentGoal.target_roas > 0 && (
                      <GoalProgress
                        label="ROAS 목표"
                        current={data.summary.roas}
                        target={currentGoal.target_roas}
                        unit="%"
                        color="bg-gradient-to-r from-violet-400 to-violet-500"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 매출/수익 추이 차트 */}
            {data.dailyTrend.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">매출/수익 추이</CardTitle>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">비용 구조</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-rose-50 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-rose-100 rounded-lg">
                          <Target className="h-4 w-4 text-rose-600" />
                        </div>
                        <span className="font-medium text-sm">광고비</span>
                      </div>
                      <span className="font-bold text-rose-700">{formatCurrency(data.summary.adCost)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-orange-50 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-orange-100 rounded-lg">
                          <Wallet className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="font-medium text-sm">운영비</span>
                      </div>
                      <span className="font-bold text-orange-700">{formatCurrency(data.summary.operatingCost)}</span>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                      <span className="font-semibold">총 비용</span>
                      <span className="font-bold text-lg">{formatCurrency(data.summary.totalCost)}</span>
                    </div>
                    {data.summary.revenue > 0 && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>비용 비율 (비용/매출)</span>
                        <span className="font-medium">{((data.summary.totalCost / data.summary.revenue) * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {data.channelRevenue.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">채널별 매출</CardTitle>
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
                          <div key={ch.channel} className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl">
                            <Badge variant="secondary" className="rounded-lg">{getChannelName(ch.channel)}</Badge>
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
                <CardTitle className="text-base font-semibold">수익성 요약</CardTitle>
                <div className="flex gap-2">
                  <Link href="/sales">
                    <Button variant="outline" size="sm" className="rounded-xl">판매장부</Button>
                  </Link>
                  <Link href="/reports">
                    <Button variant="outline" size="sm" className="rounded-xl">상세 리포트</Button>
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
                        <TableCell className={`text-right ${data.summary.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(data.summary.profit)}</TableCell>
                        <TableCell className="text-right">{data.summary.revenue > 0 ? `${(data.summary.profit / data.summary.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-rose-600">(-) 광고비</TableCell>
                        <TableCell className="text-right text-rose-600">-{formatCurrency(data.summary.adCost)}</TableCell>
                        <TableCell className="text-right">{data.summary.revenue > 0 ? `${(data.summary.adCost / data.summary.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-orange-600">(-) 운영비</TableCell>
                        <TableCell className="text-right text-orange-600">-{formatCurrency(data.summary.operatingCost)}</TableCell>
                        <TableCell className="text-right">{data.summary.revenue > 0 ? `${(data.summary.operatingCost / data.summary.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                      </TableRow>
                      <TableRow className="border-t-2 font-bold">
                        <TableCell>최종 순수익</TableCell>
                        <TableCell className={`text-right text-lg ${data.summary.netProfitAfterAll >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(data.summary.netProfitAfterAll)}
                        </TableCell>
                        <TableCell className="text-right">{data.summary.revenue > 0 ? `${(data.summary.netProfitAfterAll / data.summary.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 빠른 액션 - 파스텔 카드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/sales/new">
                <Card className="bg-blue-50 ring-0 border-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200">
                  <CardContent className="pt-6 pb-5 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="font-semibold text-sm text-blue-800">판매 기록</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/expenses/new">
                <Card className="bg-rose-50 ring-0 border-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200">
                  <CardContent className="pt-6 pb-5 text-center">
                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Target className="h-6 w-6 text-rose-600" />
                    </div>
                    <p className="font-semibold text-sm text-rose-800">광고비 등록</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/expenses/operating/new">
                <Card className="bg-amber-50 ring-0 border-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200">
                  <CardContent className="pt-6 pb-5 text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Wallet className="h-6 w-6 text-amber-600" />
                    </div>
                    <p className="font-semibold text-sm text-amber-800">운영비 등록</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/reports">
                <Card className="bg-violet-50 ring-0 border-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200">
                  <CardContent className="pt-6 pb-5 text-center">
                    <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-violet-600" />
                    </div>
                    <p className="font-semibold text-sm text-violet-800">상세 리포트</p>
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
