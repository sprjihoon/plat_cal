'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateAdvertising } from '@/lib/hooks/useExpenses';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_PRESETS } from '@/constants';

export default function NewExpensePage() {
  const router = useRouter();
  const createAd = useCreateAdvertising();

  const [channel, setChannel] = useState('smartstore');
  const [adDate, setAdDate] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState(0);
  const [impressions, setImpressions] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [conversions, setConversions] = useState(0);
  const [adType, setAdType] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const cpc = clicks > 0 ? cost / clicks : 0;
  const cpa = conversions > 0 ? cost / conversions : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createAd.mutateAsync({
        channel,
        ad_date: adDate,
        cost,
        impressions,
        clicks,
        conversions,
        ad_type: adType || null,
        campaign_name: campaignName || null,
        notes: notes || null,
      });
      router.push('/expenses');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-4">
          <Link href="/expenses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">광고비 기록 추가</h1>
            <p className="text-muted-foreground">새 광고비 내역을 기록합니다</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>광고 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>광고일 *</Label>
                  <Input
                    type="date"
                    value={adDate}
                    onChange={(e) => setAdDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>채널 *</Label>
                  <select
                    className="w-full h-10 px-3 border rounded-md text-sm"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    required
                  >
                    {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key}>{preset.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>광고 유형</Label>
                  <select
                    className="w-full h-10 px-3 border rounded-md text-sm"
                    value={adType}
                    onChange={(e) => setAdType(e.target.value)}
                  >
                    <option value="">선택 안함</option>
                    <option value="search">검색 광고</option>
                    <option value="display">디스플레이 광고</option>
                    <option value="shopping">쇼핑 광고</option>
                    <option value="brand">브랜드 광고</option>
                    <option value="video">동영상 광고</option>
                    <option value="sns">SNS 광고</option>
                    <option value="influencer">인플루언서 마케팅</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>캠페인명</Label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="예: 봄 시즌 프로모션"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>광고비 (원) *</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <button
              type="button"
              className="w-full flex items-center justify-between px-6 py-4"
              onClick={() => setShowMetrics(!showMetrics)}
            >
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">성과 지표</CardTitle>
                <span className="text-xs text-muted-foreground font-normal">선택 입력</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showMetrics ? 'rotate-180' : ''}`} />
            </button>
            {showMetrics && (
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">노출수</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={impressions}
                      onChange={(e) => setImpressions(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">클릭수</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={clicks}
                      onChange={(e) => setClicks(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs sm:text-sm">전환수</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={conversions}
                      onChange={(e) => setConversions(Number(e.target.value))}
                    />
                  </div>
                </div>

                {cost > 0 && (impressions > 0 || clicks > 0 || conversions > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">CTR</p>
                      <p className="text-lg font-semibold">{ctr.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">CVR</p>
                      <p className="text-lg font-semibold">{cvr.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">CPC</p>
                      <p className="text-lg font-semibold">{cpc.toLocaleString()}원</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">CPA</p>
                      <p className="text-lg font-semibold">{cpa.toLocaleString()}원</p>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>메모</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-24 px-3 py-2 border rounded-md resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="추가 메모 (선택사항)"
              />
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Link href="/expenses">
              <Button type="button" variant="outline">취소</Button>
            </Link>
            <Button type="submit" disabled={createAd.isPending}>
              {createAd.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              저장
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
