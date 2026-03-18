'use client';

import { useState } from 'react';
import { useProductAnalytics } from '@/lib/hooks/useProductAnalytics';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, Loader2, Package, BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';
import { BarChartComponent } from '@/components/charts';

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-[#8C9EFF]/15 text-[#4a5abf]',
  B: 'bg-yellow-100 text-yellow-800',
  C: 'bg-red-100 text-red-800',
};

export default function ProductAnalyticsPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const { data, isLoading } = useProductAnalytics(startDate, endDate);

  const getChannelName = (ch: string) =>
    PLATFORM_PRESETS[ch as keyof typeof PLATFORM_PRESETS]?.name || ch;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">상품별 수익 분석</h1>
            <p className="text-muted-foreground">상품별 매출, 마진, ABC 등급을 분석합니다</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">시작일</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">종료일</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? null : (
          <>
            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">총 매출</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(data.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">총 순이익</p>
                  <p className={`text-xl font-bold ${data.totalProfit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
                    {formatCurrency(data.totalProfit)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">총 판매 수량</p>
                  <p className="text-xl font-bold">{data.totalQuantity.toLocaleString()}개</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">분석 상품 수</p>
                  <p className="text-xl font-bold">{data.products.length}개</p>
                </CardContent>
              </Card>
            </div>

            {/* 매출 TOP 10 차트 */}
            {data.products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    매출 TOP 10
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChartComponent
                    data={data.products.slice(0, 10).map((p) => ({
                      name: p.name.length > 10 ? p.name.slice(0, 10) + '...' : p.name,
                      revenue: p.revenue,
                      profit: p.profit,
                    }))}
                    bars={[
                      { dataKey: 'revenue', name: '매출', color: '#8C9EFF' },
                      { dataKey: 'profit', name: '순이익', color: '#D6F74C' },
                    ]}
                    layout="vertical"
                  />
                </CardContent>
              </Card>
            )}

            {/* ABC 분석 요약 */}
            <div className="grid grid-cols-3 gap-4">
              {(['A', 'B', 'C'] as const).map((grade) => {
                const items = data.products.filter((p) => p.abcGrade === grade);
                const gradeRevenue = items.reduce((s, p) => s + p.revenue, 0);
                return (
                  <Card key={grade}>
                    <CardContent className="pt-6 text-center">
                      <Badge className={GRADE_COLORS[grade]}>{grade} 등급</Badge>
                      <p className="text-2xl font-bold mt-2">{items.length}개</p>
                      <p className="text-sm text-muted-foreground">
                        매출 {data.totalRevenue > 0 ? ((gradeRevenue / data.totalRevenue) * 100).toFixed(1) : 0}%
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 상품별 상세 테이블 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  상품별 상세
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>등급</TableHead>
                      <TableHead>상품명</TableHead>
                      <TableHead className="text-right">매출</TableHead>
                      <TableHead className="text-right">순이익</TableHead>
                      <TableHead className="text-right">마진율</TableHead>
                      <TableHead className="text-right">판매량</TableHead>
                      <TableHead className="text-right">매출 비중</TableHead>
                      <TableHead className="text-right">반품</TableHead>
                      <TableHead>채널</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Badge className={GRADE_COLORS[p.abcGrade]}>{p.abcGrade}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/products/${p.id}`} className="hover:underline">
                            {p.name}
                          </Link>
                          {p.sku && <span className="text-xs text-muted-foreground ml-1">({p.sku})</span>}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(p.revenue)}</TableCell>
                        <TableCell className={`text-right ${p.profit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
                          {formatCurrency(p.profit)}
                        </TableCell>
                        <TableCell className={`text-right ${p.marginRate >= 20 ? 'text-[#4a5abf]' : p.marginRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {p.marginRate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">{p.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{p.revenueShare.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">
                          {p.returnCount > 0 ? (
                            <span className="text-red-600">{p.returnCount}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {p.channels.map((ch) => (
                              <Badge key={ch} variant="outline" className="text-xs">
                                {getChannelName(ch)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
