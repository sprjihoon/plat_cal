'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateAdvertising, calculateCPC, calculateCTR, calculateCVR } from '@/lib/hooks/useExpenses';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_PRESETS } from '@/constants';
import { formatCurrency } from '@/lib/calculator';

export default function EditAdvertisingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const updateAd = useUpdateAdvertising();

  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState('smartstore');
  const [adDate, setAdDate] = useState('');
  const [cost, setCost] = useState('');
  const [impressions, setImpressions] = useState('');
  const [clicks, setClicks] = useState('');
  const [conversions, setConversions] = useState('');
  const [adType, setAdType] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await fetch(`/api/expenses/advertising/${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setChannel(data.channel);
        setAdDate(data.ad_date);
        setCost(String(data.cost));
        setImpressions(String(data.impressions || 0));
        setClicks(String(data.clicks || 0));
        setConversions(String(data.conversions || 0));
        if (data.impressions > 0 || data.clicks > 0 || data.conversions > 0) {
          setShowMetrics(true);
        }
        setAdType(data.ad_type || '');
        setCampaignName(data.campaign_name || '');
        setNotes(data.notes || '');
      } catch (err) {
        setError('데이터를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [id]);

  const costNum = parseFloat(cost) || 0;
  const impressionsNum = parseInt(impressions) || 0;
  const clicksNum = parseInt(clicks) || 0;
  const conversionsNum = parseInt(conversions) || 0;

  const cpc = calculateCPC(costNum, clicksNum);
  const ctr = calculateCTR(clicksNum, impressionsNum);
  const cvr = calculateCVR(conversionsNum, clicksNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cost || parseFloat(cost) <= 0) {
      setError('광고비를 입력해주세요');
      return;
    }

    try {
      await updateAd.mutateAsync({
        id,
        channel,
        ad_date: adDate,
        cost: costNum,
        impressions: impressionsNum,
        clicks: clicksNum,
        conversions: conversionsNum,
        ad_type: adType || null,
        campaign_name: campaignName || null,
        notes: notes || null,
      });
      router.push('/expenses');
    } catch (err) {
      setError('수정에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-3 py-4 space-y-4 sm:px-4 sm:py-6 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/expenses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">광고비 수정</h1>
            <p className="text-muted-foreground">광고비 기록을 수정합니다</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>날짜 *</Label>
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
                    className="w-full h-10 px-3 border rounded-md"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>광고비 (원) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>광고 유형</Label>
                  <Input
                    placeholder="예: 검색광고, 디스플레이"
                    value={adType}
                    onChange={(e) => setAdType(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>캠페인명</Label>
                <Input
                  placeholder="캠페인 이름"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>노출수</Label>
                    <Input
                      type="number"
                      min="0"
                      value={impressions}
                      onChange={(e) => setImpressions(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>클릭수</Label>
                    <Input
                      type="number"
                      min="0"
                      value={clicks}
                      onChange={(e) => setClicks(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>전환수</Label>
                    <Input
                      type="number"
                      min="0"
                      value={conversions}
                      onChange={(e) => setConversions(e.target.value)}
                    />
                  </div>
                </div>

                {costNum > 0 && (impressionsNum > 0 || clicksNum > 0 || conversionsNum > 0) && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">CPC (클릭당 비용)</p>
                      <p className="font-semibold">{formatCurrency(cpc)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CTR (클릭률)</p>
                      <p className="font-semibold">{ctr.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CVR (전환율)</p>
                      <p className="font-semibold">{cvr.toFixed(2)}%</p>
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
              <Textarea
                placeholder="추가 메모"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
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
            <Button type="submit" disabled={updateAd.isPending}>
              {updateAd.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              저장
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
