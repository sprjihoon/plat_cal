'use client';

import { useState, useMemo } from 'react';
import { useProducts } from '@/lib/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Loader2,
  Store,
  Search,
  Pencil,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { PLATFORM_PRESETS } from '@/constants';
import { calculateMargin, formatCurrency } from '@/lib/calculator';
import type { CalculatorInputs } from '@/types';
import { DateFilter, getToday } from '@/components/ui/date-filter';
import { Pagination, type PageSize } from '@/components/ui/pagination';

function getChannelName(channel: string) {
  return PLATFORM_PRESETS[channel as keyof typeof PLATFORM_PRESETS]?.name || channel;
}

function getSubOptionName(channel: string, subOptionId: string | null) {
  if (!subOptionId) return null;
  const preset = PLATFORM_PRESETS[channel as keyof typeof PLATFORM_PRESETS];
  return preset?.subOptions?.find(o => o.id === subOptionId)?.name || null;
}

function calcProfit(market: any, baseCost: number) {
  const additionalCosts = market.additional_costs || {};
  const inputs: CalculatorInputs = {
    sellingPrice: market.selling_price,
    productCost: baseCost,
    discountRate: 0,
    discountAmount: 0,
    platformFeeRate: market.platform_fee_rate,
    paymentFeeRate: market.payment_fee_rate,
    couponBurden: 0,
    sellerShippingCost: additionalCosts.shipping_cost || 0,
    customerShippingCost: 0,
    packagingCost: additionalCosts.packaging_cost || 0,
    materialCost: 0,
    advertisingCost: additionalCosts.advertising_cost || 0,
    otherCosts: additionalCosts.other_costs || 0,
    sellingPriceVatIncluded: true,
    wholesaleVatType: 'excluded',
    targetMarginRate: 30,
  };
  try {
    return calculateMargin(inputs);
  } catch {
    return null;
  }
}

export default function MarketsPage() {
  const today = getToday();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(30);

  const { data, isLoading } = useProducts(1, 9999, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const allMarkets = useMemo(() =>
    (data?.products || []).flatMap(product =>
      (product.product_markets || []).map(market => ({
        ...market,
        productName: product.name,
        productSku: product.sku,
        productId: product.id,
        baseCost: product.base_cost,
      }))
    ), [data?.products]);

  const channels = useMemo(() => [...new Set(allMarkets.map(m => m.channel))], [allMarkets]);

  const filteredMarkets = useMemo(() => allMarkets.filter(market => {
    const matchSearch = !search ||
      market.productName.toLowerCase().includes(search.toLowerCase()) ||
      (market.productSku && market.productSku.toLowerCase().includes(search.toLowerCase()));
    const matchChannel = channelFilter === 'all' || market.channel === channelFilter;
    return matchSearch && matchChannel;
  }), [allMarkets, search, channelFilter]);

  const totalFiltered = filteredMarkets.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const pagedMarkets = filteredMarkets.slice((page - 1) * pageSize, page * pageSize);

  const channelStats = useMemo(() => channels.map(channel => {
    const items = allMarkets.filter(m => m.channel === channel);
    const activeCount = items.filter(m => m.is_active).length;
    return { channel, count: items.length, activeCount };
  }), [channels, allMarkets]);

  const totalActive = allMarkets.filter(m => m.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">마켓 관리</h1>
            <p className="text-muted-foreground">
              등록된 모든 마켓 설정을 한눈에 관리합니다
            </p>
          </div>
        </div>

        {/* 날짜 필터 */}
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(d) => { setStartDate(d); setPage(1); }}
          onEndDateChange={(d) => { setEndDate(d); setPage(1); }}
          defaultQuick={0}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* 채널별 요약 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="cursor-pointer hover:border-primary/50" onClick={() => { setChannelFilter('all'); setPage(1); }}>
                <CardContent className="pt-4 text-center">
                  <Store className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{allMarkets.length}</p>
                  <p className="text-xs text-muted-foreground">전체 마켓 ({totalActive}개 활성)</p>
                </CardContent>
              </Card>
              {channelStats.map(stat => (
                <Card
                  key={stat.channel}
                  className={`cursor-pointer transition-all ${channelFilter === stat.channel ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
                  onClick={() => { setChannelFilter(channelFilter === stat.channel ? 'all' : stat.channel); setPage(1); }}
                >
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm font-medium">{getChannelName(stat.channel)}</p>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-xs text-muted-foreground">{stat.activeCount}개 활성</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 검색 및 필터 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="상품명 또는 SKU로 검색..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <select
                className="h-10 px-3 border rounded-md bg-white text-sm"
                value={channelFilter}
                onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
              >
                <option value="all">전체 채널</option>
                {channels.map(ch => (
                  <option key={ch} value={ch}>{getChannelName(ch)}</option>
                ))}
              </select>
            </div>

            {/* 마켓 목록 */}
            {filteredMarkets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  {allMarkets.length === 0 ? (
                    <>
                      <p className="text-muted-foreground">등록된 마켓이 없습니다</p>
                      <p className="text-sm text-muted-foreground mt-1">상품 관리에서 마켓을 추가해보세요</p>
                      <Link href="/products">
                        <Button variant="outline" className="mt-4">
                          <Package className="h-4 w-4 mr-2" />
                          상품 관리로 이동
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <p className="text-muted-foreground">검색 결과가 없습니다</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {pagedMarkets.map((market) => {
                    const result = calcProfit(market, market.baseCost);
                    const marginRate = result?.marginRate || 0;

                    return (
                      <Card key={market.id} className={!market.is_active ? 'opacity-60' : ''}>
                        <CardContent className="py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={market.is_active ? 'default' : 'secondary'}>
                                  {getChannelName(market.channel)}
                                </Badge>
                                {getSubOptionName(market.channel, market.sub_option_id) && (
                                  <Badge variant="outline" className="text-xs">
                                    {getSubOptionName(market.channel, market.sub_option_id)}
                                  </Badge>
                                )}
                                {!market.is_active && (
                                  <Badge variant="secondary" className="text-xs">비활성</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(market.created_at).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                              <Link
                                href={`/products/${market.productId}`}
                                className="text-sm font-medium mt-1 block hover:underline truncate"
                              >
                                {market.productName}
                                {market.productSku && (
                                  <span className="text-muted-foreground ml-1">({market.productSku})</span>
                                )}
                              </Link>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>판매가: {formatCurrency(market.selling_price)}</span>
                                <span>수수료: {(market.platform_fee_rate + market.payment_fee_rate).toFixed(1)}%</span>
                                <span>원가: {formatCurrency(market.baseCost)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {result ? (
                                <>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">순이익</p>
                                    <p className={`text-sm font-bold ${result.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatCurrency(result.netProfit)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">마진율</p>
                                    <div className="flex items-center gap-1">
                                      {marginRate > 20 ? (
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                      ) : marginRate > 0 ? (
                                        <Minus className="h-3 w-3 text-yellow-600" />
                                      ) : (
                                        <TrendingDown className="h-3 w-3 text-red-600" />
                                      )}
                                      <p className={`text-sm font-bold ${
                                        marginRate > 20 ? 'text-green-600' :
                                        marginRate > 0 ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                        {marginRate.toFixed(1)}%
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">계산 불가</span>
                              )}

                              <Link href={`/products/${market.productId}/edit`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={totalFiltered}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
