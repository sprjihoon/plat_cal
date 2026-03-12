'use client';

import { useDashboard } from '@/lib/hooks/useDashboard';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Store,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  const getChannelName = (channel: string) => {
    return PLATFORM_PRESETS[channel as keyof typeof PLATFORM_PRESETS]?.name || channel;
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
                <Button variant="ghost" size="sm" className="bg-gray-100">대시보드</Button>
              </Link>
              <Link href="/products">
                <Button variant="ghost" size="sm">상품 관리</Button>
              </Link>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">대시보드</h1>
            <p className="text-muted-foreground">전체 상품 수익 현황을 확인합니다</p>
          </div>
          <Link href="/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              상품 등록
            </Button>
          </Link>
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
        ) : !data || data.summary.totalProducts === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">등록된 상품이 없습니다</p>
              <Link href="/products/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  첫 상품 등록하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 요약 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">총 상품</p>
                      <p className="text-2xl font-bold">{data.summary.totalProducts}개</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Store className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">총 마켓 설정</p>
                      <p className="text-2xl font-bold">{data.summary.totalMarkets}개</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${data.summary.totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <DollarSign className={`h-5 w-5 ${data.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">예상 총 수익</p>
                      <p className={`text-2xl font-bold ${data.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.summary.totalProfit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">상품당 평균 수익</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(data.summary.avgProfitPerProduct)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 수익/손실 상품 비율 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    수익 상품 TOP 5
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.topProfitProducts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">데이터 없음</p>
                  ) : (
                    <div className="space-y-3">
                      {data.topProfitProducts.map((product, index) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-muted-foreground w-6">
                              {index + 1}
                            </span>
                            <span className="font-medium truncate max-w-[200px]">
                              {product.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatCurrency(product.profit)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.marginRate.toFixed(1)}%
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    저수익 상품 TOP 5
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.lowProfitProducts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">데이터 없음</p>
                  ) : (
                    <div className="space-y-3">
                      {data.lowProfitProducts.map((product, index) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-muted-foreground w-6">
                              {index + 1}
                            </span>
                            <span className="font-medium truncate max-w-[200px]">
                              {product.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${product.profit >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {formatCurrency(product.profit)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.marginRate.toFixed(1)}%
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 마켓별 통계 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>마켓별 수익 현황</CardTitle>
                <Link href="/products">
                  <Button variant="ghost" size="sm">
                    전체 보기 <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {data.marketSummary.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">마켓 설정이 없습니다</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.marketSummary.map((market) => (
                      <div
                        key={market.channel}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{getChannelName(market.channel)}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {market.count}개 상품
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">총 수익</span>
                            <span className={`font-semibold ${market.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(market.totalProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">평균 수익</span>
                            <span className="font-semibold">
                              {formatCurrency(market.avgProfit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
