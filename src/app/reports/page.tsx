'use client';

import { useState } from 'react';
import { useReport, getDateRange } from '@/lib/hooks/useReports';
import { Header } from '@/components/layout/Header';
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
  DollarSign,
  Target,
  BarChart3,
  FileText,
  Download,
  Wallet,
  ShoppingCart,
  PieChart,
  Receipt,
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';
import { SalesChart, ChannelPieChart, BarChartComponent } from '@/components/charts';
import { getCategoryName } from '@/lib/hooks/useOperatingExpenses';

type GroupBy = 'day' | 'week' | 'month';

const PERIOD_PRESETS = [
  { key: 'today', label: '오늘' },
  { key: 'yesterday', label: '어제' },
  { key: 'week', label: '1주일' },
  { key: '2weeks', label: '2주일' },
  { key: 'thisMonth', label: '이번 달' },
  { key: 'lastMonth', label: '지난 달' },
  { key: 'month', label: '최근 30일' },
  { key: 'quarter', label: '분기 (3개월)' },
  { key: 'firstHalf', label: '상반기' },
  { key: 'secondHalf', label: '하반기' },
  { key: 'year', label: '1년' },
];

export default function ReportsPage() {
  const initialRange = getDateRange('month');
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [activePreset, setActivePreset] = useState('month');

  const { data, isLoading, error } = useReport({ startDate, endDate, groupBy });

  const handlePreset = (preset: string) => {
    const range = getDateRange(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setActivePreset(preset);

    const daysDiff = (new Date(range.endDate).getTime() - new Date(range.startDate).getTime()) / 86400000;
    if (daysDiff <= 14) setGroupBy('day');
    else if (daysDiff <= 90) setGroupBy('week');
    else setGroupBy('month');
  };

  const getChannelName = (ch: string) => {
    return PLATFORM_PRESETS[ch as keyof typeof PLATFORM_PRESETS]?.name || ch;
  };

  const formatPeriod = (period: string) => {
    if (groupBy === 'month') {
      const [year, month] = period.split('-');
      return `${year}년 ${month}월`;
    }
    if (groupBy === 'week') {
      const d = new Date(period);
      const end = new Date(d);
      end.setDate(end.getDate() + 6);
      return `${d.getMonth() + 1}/${d.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
    }
    return new Date(period).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleExport = (type: string) => {
    const params = new URLSearchParams({ type, startDate, endDate, format: 'csv' });
    window.open(`/api/export?${params}`, '_blank');
  };

  const ts = data?.totalSummary;

  return (
    <div className="bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">결산 리포트</h1>
            <p className="text-muted-foreground">기간별 매출, 비용, 수익을 종합 분석합니다</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('sales')}>
              <Download className="h-4 w-4 mr-2" />판매
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('advertising')}>
              <Download className="h-4 w-4 mr-2" />광고비
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('report')}>
              <Download className="h-4 w-4 mr-2" />리포트
            </Button>
          </div>
        </div>

        {/* 기간 선택 */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {PERIOD_PRESETS.map((p) => (
                <Button
                  key={p.key}
                  variant={activePreset === p.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePreset(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">시작일</label>
                <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setActivePreset(''); }} />
              </div>
              <div>
                <label className="text-sm font-medium">종료일</label>
                <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setActivePreset(''); }} />
              </div>
              <div>
                <label className="text-sm font-medium">집계 단위</label>
                <select className="w-full h-10 px-3 border rounded-md" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
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
          <Card><CardContent className="py-12 text-center text-muted-foreground">데이터를 불러오는데 실패했습니다</CardContent></Card>
        ) : !data ? (
          <Card><CardContent className="py-12 text-center"><FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">기간을 선택하세요</p></CardContent></Card>
        ) : (
          <>
            {/* 핵심 KPI 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><DollarSign className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">총 매출</p>
                      <p className="text-xl font-bold">{formatCurrency(ts!.revenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg"><Wallet className="h-5 w-5 text-red-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">총 비용</p>
                      <p className="text-xl font-bold">{formatCurrency(ts!.totalCost)}</p>
                      <p className="text-xs text-muted-foreground">광고 {formatCurrency(ts!.adCost)} + 운영 {formatCurrency(ts!.operatingCost)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${ts!.netProfitAfterAll >= 0 ? 'bg-[#8C9EFF]/15' : 'bg-red-100'}`}>
                      <TrendingUp className={`h-5 w-5 ${ts!.netProfitAfterAll >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">최종 순수익</p>
                      <p className={`text-xl font-bold ${ts!.netProfitAfterAll >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
                        {formatCurrency(ts!.netProfitAfterAll)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg"><ShoppingCart className="h-5 w-5 text-purple-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">판매</p>
                      <p className="text-xl font-bold">{ts!.salesCount.toLocaleString()}건 / {ts!.quantity.toLocaleString()}개</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ROI / ROAS / 마진율 / 전환 */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS</p>
                    <p className={`text-2xl font-bold ${ts!.roas >= 100 ? 'text-[#4a5abf]' : ts!.roas > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      {ts!.adCost > 0 ? `${ts!.roas.toFixed(0)}%` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className={`text-2xl font-bold ${ts!.roi >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
                      {ts!.totalCost > 0 ? `${ts!.roi.toFixed(0)}%` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">마진율</p>
                    <p className={`text-2xl font-bold ${ts!.marginRate >= 20 ? 'text-[#4a5abf]' : ts!.marginRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {ts!.revenue > 0 ? `${ts!.marginRate.toFixed(1)}%` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">광고 전환수</p>
                    <p className="text-2xl font-bold">{ts!.conversions.toLocaleString()}건</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">전환당 비용</p>
                    <p className="text-2xl font-bold">{ts!.conversions > 0 ? formatCurrency(ts!.adCost / ts!.conversions) : '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 손익 계산서 */}
            <Card>
              <CardHeader><CardTitle>손익 계산서</CardTitle></CardHeader>
              <CardContent>
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
                      <TableCell className="text-right font-bold text-blue-600">{formatCurrency(ts!.revenue)}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">상품 순이익 (플랫폼 수수료 차감)</TableCell>
                      <TableCell className={`text-right ${ts!.profit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>{formatCurrency(ts!.profit)}</TableCell>
                      <TableCell className="text-right">{ts!.revenue > 0 ? `${(ts!.profit / ts!.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-red-600 pl-8">(-) 광고비</TableCell>
                      <TableCell className="text-right text-red-600">-{formatCurrency(ts!.adCost)}</TableCell>
                      <TableCell className="text-right">{ts!.revenue > 0 ? `${(ts!.adCost / ts!.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-orange-600 pl-8">(-) 운영비</TableCell>
                      <TableCell className="text-right text-orange-600">-{formatCurrency(ts!.operatingCost)}</TableCell>
                      <TableCell className="text-right">{ts!.revenue > 0 ? `${(ts!.operatingCost / ts!.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                    </TableRow>
                    <TableRow className="bg-amber-50/50 dark:bg-amber-950/20">
                      <TableCell className="font-medium text-amber-700 dark:text-amber-400 pl-8">납부부가세 (참고)</TableCell>
                      <TableCell className="text-right text-amber-700 dark:text-amber-400">{formatCurrency(Math.round(ts!.vatPayable))}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">매출VAT {formatCurrency(Math.round(ts!.salesVat))} - 매입VAT {formatCurrency(Math.round(ts!.purchaseVat))}</TableCell>
                    </TableRow>
                    <TableRow className="border-t-2 font-bold text-lg">
                      <TableCell>최종 순수익</TableCell>
                      <TableCell className={`text-right ${ts!.netProfitAfterAll >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
                        {formatCurrency(ts!.netProfitAfterAll)}
                      </TableCell>
                      <TableCell className="text-right">{ts!.revenue > 0 ? `${(ts!.netProfitAfterAll / ts!.revenue * 100).toFixed(1)}%` : '-'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* 부가세 상세 */}
            {ts!.revenue > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    부가세 매입/매출 내역
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="p-5 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-2">매출부가세</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(Math.round(ts!.salesVat))}</p>
                      <p className="text-xs text-muted-foreground mt-1">총매출 ÷ 11</p>
                    </div>
                    <div className="p-5 bg-green-50 dark:bg-green-950/30 rounded-xl text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-2">매입부가세</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(Math.round(ts!.purchaseVat))}</p>
                      <p className="text-xs text-muted-foreground mt-1">수수료 VAT 공제분</p>
                    </div>
                    <div className="p-5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-2">납부부가세</p>
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{formatCurrency(Math.round(ts!.vatPayable))}</p>
                      <p className="text-xs text-muted-foreground mt-1">매출VAT - 매입VAT</p>
                    </div>
                  </div>

                  {data.periodSummaries.length > 1 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>기간</TableHead>
                          <TableHead className="text-right">매출부가세</TableHead>
                          <TableHead className="text-right">매입부가세</TableHead>
                          <TableHead className="text-right">납부부가세</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.periodSummaries.map((p) => (
                          <TableRow key={`vat-${p.period}`}>
                            <TableCell className="font-medium whitespace-nowrap">{formatPeriod(p.period)}</TableCell>
                            <TableCell className="text-right text-blue-700 dark:text-blue-400">{formatCurrency(Math.round(p.salesVat))}</TableCell>
                            <TableCell className="text-right text-green-700 dark:text-green-400">{formatCurrency(Math.round(p.purchaseVat))}</TableCell>
                            <TableCell className="text-right font-medium text-amber-700 dark:text-amber-400">{formatCurrency(Math.round(p.vatPayable))}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2 font-bold bg-gray-50 dark:bg-gray-900">
                          <TableCell>합계</TableCell>
                          <TableCell className="text-right text-blue-700 dark:text-blue-400">{formatCurrency(Math.round(ts!.salesVat))}</TableCell>
                          <TableCell className="text-right text-green-700 dark:text-green-400">{formatCurrency(Math.round(ts!.purchaseVat))}</TableCell>
                          <TableCell className="text-right text-amber-700 dark:text-amber-400">{formatCurrency(Math.round(ts!.vatPayable))}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 운영비 카테고리별 */}
            {data.expenseCategorySummary && data.expenseCategorySummary.length > 0 && (
              <Card>
                <CardHeader><CardTitle>운영비 카테고리별 내역</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {data.expenseCategorySummary.map((cat) => (
                      <div key={cat.category} className="p-3 border rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">{getCategoryName(cat.category)}</p>
                        <p className="text-lg font-bold">{formatCurrency(cat.amount)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 매출/이익 추이 차트 */}
            {data.periodSummaries.length > 1 && (
              <Card>
                <CardHeader><CardTitle>매출/수익 추이</CardTitle></CardHeader>
                <CardContent>
                  <SalesChart data={data.periodSummaries.map((p) => ({ date: p.period, revenue: p.revenue, profit: p.netProfitAfterAll }))} />
                </CardContent>
              </Card>
            )}

            {/* 채널별 차트 */}
            {data.channelSummary.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.channelSummary.length > 1 && (
                  <Card>
                    <CardHeader><CardTitle>채널별 매출 비중</CardTitle></CardHeader>
                    <CardContent>
                      <ChannelPieChart data={data.channelSummary.map((ch) => ({ channel: ch.channel, name: getChannelName(ch.channel), value: ch.revenue }))} />
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader><CardTitle>채널별 매출/이익</CardTitle></CardHeader>
                  <CardContent>
                    <BarChartComponent
                      data={data.channelSummary.map((ch) => ({ name: getChannelName(ch.channel), revenue: ch.revenue, profit: ch.profit }))}
                      bars={[
                        { dataKey: 'revenue', name: '매출', color: '#8C9EFF' },
                        { dataKey: 'profit', name: '순이익', color: '#a8c030' },
                      ]}
                      layout="vertical"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 채널별 실적 카드 */}
            {data.channelSummary.length > 0 && (
              <Card>
                <CardHeader><CardTitle>채널별 실적</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.channelSummary.map((ch) => {
                      const chRoas = (ch.adCost && ch.adCost > 0) ? (ch.revenue / ch.adCost * 100) : 0;
                      return (
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
                              <span className={`font-medium ${ch.profit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>{formatCurrency(ch.profit)}</span>
                            </div>
                            {ch.adCost !== undefined && ch.adCost > 0 && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">광고비</span>
                                  <span className="font-medium text-red-600">-{formatCurrency(ch.adCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">ROAS</span>
                                  <span className={`font-medium ${chRoas >= 100 ? 'text-[#4a5abf]' : 'text-yellow-600'}`}>{chRoas.toFixed(0)}%</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 기간별 상세 테이블 */}
            {data.periodSummaries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{groupBy === 'day' ? '일별' : groupBy === 'week' ? '주별' : '월별'} 상세</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>기간</TableHead>
                        <TableHead className="text-right">매출</TableHead>
                        <TableHead className="text-right">순이익</TableHead>
                        <TableHead className="text-right">광고비</TableHead>
                        <TableHead className="text-right">운영비</TableHead>
                        <TableHead className="text-right">최종 수익</TableHead>
                        <TableHead className="text-right">ROAS</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.periodSummaries.map((p) => (
                        <TableRow key={p.period}>
                          <TableCell className="font-medium whitespace-nowrap">{formatPeriod(p.period)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                          <TableCell className={`text-right ${p.profit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>{formatCurrency(p.profit)}</TableCell>
                          <TableCell className="text-right text-red-600">{p.adCost > 0 ? `-${formatCurrency(p.adCost)}` : '-'}</TableCell>
                          <TableCell className="text-right text-orange-600">{p.operatingCost > 0 ? `-${formatCurrency(p.operatingCost)}` : '-'}</TableCell>
                          <TableCell className={`text-right font-bold ${p.netProfitAfterAll >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
                            {formatCurrency(p.netProfitAfterAll)}
                          </TableCell>
                          <TableCell className={`text-right ${p.roas >= 100 ? 'text-[#4a5abf]' : 'text-yellow-600'}`}>
                            {p.adCost > 0 ? `${p.roas.toFixed(0)}%` : '-'}
                          </TableCell>
                          <TableCell className={`text-right ${p.roi >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
                            {p.totalCost > 0 ? `${p.roi.toFixed(0)}%` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* 합계 행 */}
                      <TableRow className="border-t-2 font-bold bg-gray-50">
                        <TableCell>합계</TableCell>
                        <TableCell className="text-right">{formatCurrency(ts!.revenue)}</TableCell>
                        <TableCell className={`text-right ${ts!.profit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>{formatCurrency(ts!.profit)}</TableCell>
                        <TableCell className="text-right text-red-600">{ts!.adCost > 0 ? `-${formatCurrency(ts!.adCost)}` : '-'}</TableCell>
                        <TableCell className="text-right text-orange-600">{ts!.operatingCost > 0 ? `-${formatCurrency(ts!.operatingCost)}` : '-'}</TableCell>
                        <TableCell className={`text-right ${ts!.netProfitAfterAll >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>{formatCurrency(ts!.netProfitAfterAll)}</TableCell>
                        <TableCell className={`text-right ${ts!.roas >= 100 ? 'text-[#4a5abf]' : 'text-yellow-600'}`}>{ts!.adCost > 0 ? `${ts!.roas.toFixed(0)}%` : '-'}</TableCell>
                        <TableCell className={`text-right ${ts!.roi >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>{ts!.totalCost > 0 ? `${ts!.roi.toFixed(0)}%` : '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
