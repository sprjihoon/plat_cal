'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  Download,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { PLATFORM_PRESETS } from '@/constants';
import { calculateMargin, formatCurrency, parseNumericInput } from '@/lib/calculator';
import { readFile, getFileAcceptTypes } from '@/lib/excel-reader';
import { loadPlatformSettings } from '@/lib/storage';
import type { SalesChannel, CalculatorInputs, PlatformPreset } from '@/types';

interface ResearchItem {
  id: string;
  name: string;
  cost: number;
  sellingPrice: number;
  shippingCost: number;
}

interface AnalyzedItem extends ResearchItem {
  fee: number;
  netProfit: number;
  marginRate: number;
  verdict: 'good' | 'normal' | 'bad';
}

type Verdict = 'good' | 'normal' | 'bad';

const VERDICT_CONFIG: Record<Verdict, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  good: { label: '적합', icon: CheckCircle, color: 'text-[#6b7a1a]', bg: 'bg-[#D6F74C]/15' },
  normal: { label: '보통', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  bad: { label: '부적합', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function MarketResearchPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [platformPresets, setPlatformPresets] = useState<Record<SalesChannel, PlatformPreset>>(PLATFORM_PRESETS);
  const [channel, setChannel] = useState<SalesChannel>('smartstore');
  const [goodThreshold, setGoodThreshold] = useState(25);
  const [normalThreshold, setNormalThreshold] = useState(15);
  const [defaultShipping, setDefaultShipping] = useState(0);
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/auth/login?redirectTo=/market-research');
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  useEffect(() => {
    const loaded = loadPlatformSettings();
    setPlatformPresets(loaded);
  }, []);

  const preset = platformPresets[channel];
  const totalFeeRate = preset.platformFeeRate + preset.paymentFeeRate;

  const analyzeItem = useCallback((item: ResearchItem): AnalyzedItem => {
    const inputs: CalculatorInputs = {
      sellingPrice: item.sellingPrice,
      productCost: item.cost,
      discountRate: 0,
      discountAmount: 0,
      platformFeeRate: preset.platformFeeRate,
      paymentFeeRate: preset.paymentFeeRate,
      couponBurden: 0,
      sellerShippingCost: item.shippingCost || defaultShipping,
      customerShippingCost: 0,
      packagingCost: 0,
      materialCost: 0,
      advertisingCost: 0,
      otherCosts: 0,
      sellingPriceVatIncluded: true,
      wholesaleVatType: 'excluded',
      targetMarginRate: 30,
    };

    try {
      const result = calculateMargin(inputs);
      const fee = result.platformFee + result.paymentFee;
      let verdict: Verdict = 'bad';
      if (result.marginRate >= goodThreshold) verdict = 'good';
      else if (result.marginRate >= normalThreshold) verdict = 'normal';

      return { ...item, fee, netProfit: result.netProfit, marginRate: result.marginRate, verdict };
    } catch {
      return { ...item, fee: 0, netProfit: 0, marginRate: 0, verdict: 'bad' };
    }
  }, [preset, defaultShipping, goodThreshold, normalThreshold]);

  const analyzed = useMemo(() => items.map(analyzeItem), [items, analyzeItem]);

  const summary = useMemo(() => {
    const good = analyzed.filter(i => i.verdict === 'good').length;
    const normal = analyzed.filter(i => i.verdict === 'normal').length;
    const bad = analyzed.filter(i => i.verdict === 'bad').length;
    const avgMargin = analyzed.length > 0
      ? analyzed.reduce((s, i) => s + i.marginRate, 0) / analyzed.length
      : 0;
    return { total: analyzed.length, good, normal, bad, avgMargin };
  }, [analyzed]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const sheets = await readFile(file);
      if (sheets.length === 0 || sheets[0].rows.length === 0) {
        alert('데이터가 없습니다');
        return;
      }

      const sheet = sheets[0];
      const nameCol = sheet.headers.find(h => /상품명|이름|품명|name|제품명|상품/i.test(h));
      const costCol = sheet.headers.find(h => /원가|매입가|사입가|도매가|cost|매입|입고가/i.test(h));
      const priceCol = sheet.headers.find(h => /판매가|가격|selling|price|정가|소비자가/i.test(h));
      const shippingCol = sheet.headers.find(h => /배송비|배송|shipping/i.test(h));

      if (!costCol && !priceCol) {
        alert('원가 또는 판매가 컬럼을 찾을 수 없습니다.\n컬럼명에 "원가", "판매가" 등이 포함되어야 합니다.');
        return;
      }

      const newItems: ResearchItem[] = sheet.rows
        .map((row, idx) => {
          const cost = parseNumericInput(row[costCol || ''] || '0');
          const price = parseNumericInput(row[priceCol || ''] || '0');
          if (cost <= 0 && price <= 0) return null;

          return {
            id: `upload_${Date.now()}_${idx}`,
            name: row[nameCol || ''] || `상품 ${idx + 1}`,
            cost,
            sellingPrice: price,
            shippingCost: shippingCol ? parseNumericInput(row[shippingCol] || '0') : 0,
          };
        })
        .filter((item): item is ResearchItem => item !== null);

      if (newItems.length === 0) {
        alert('유효한 데이터가 없습니다');
        return;
      }

      setItems(prev => [...prev, ...newItems]);
    } catch (err) {
      alert('파일을 읽는 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const handleAddManual = useCallback(() => {
    setItems(prev => [...prev, {
      id: `manual_${Date.now()}`,
      name: '',
      cost: 0,
      sellingPrice: 0,
      shippingCost: 0,
    }]);
  }, []);

  const handleItemChange = useCallback((id: string, field: keyof ResearchItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (field === 'name') return { ...item, name: value as string };
      return { ...item, [field]: typeof value === 'string' ? parseNumericInput(value) : value };
    }));
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setItems([]);
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    const XLSX = await import('xlsx');
    const template = [
      { '상품명': '니트 가디건', '원가': 8000, '판매가': 25000, '배송비': 3000 },
      { '상품명': '린넨 셔츠', '원가': 12000, '판매가': 35000, '배송비': 3000 },
      { '상품명': '코튼 팬츠', '원가': 10000, '판매가': 29000, '배송비': 0 },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '시장조사');
    XLSX.writeFile(wb, '시장조사_템플릿.xlsx');
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (analyzed.length === 0) return;
    const XLSX = await import('xlsx');

    const data = analyzed.map(item => ({
      '상품명': item.name,
      '원가': item.cost,
      '판매가': item.sellingPrice,
      '배송비': item.shippingCost,
      '수수료': Math.round(item.fee),
      '순이익': Math.round(item.netProfit),
      '마진율(%)': Number(item.marginRate.toFixed(1)),
      '판정': VERDICT_CONFIG[item.verdict].label,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '시장조사 분석');
    XLSX.writeFile(wb, `시장조사_분석_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [analyzed]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">시장조사 판별</h1>
          <p className="text-muted-foreground mt-1">엑셀로 상품 목록을 올리면 마진율 기반으로 적합/부적합을 판별합니다</p>
        </div>

        {/* 설정 영역 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">판별 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>판매 채널</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as SalesChannel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(platformPresets).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">수수료 합계 {totalFeeRate.toFixed(2)}%</p>
              </div>

              <div className="space-y-2">
                <Label>적합 기준 (%)</Label>
                <Input
                  type="number"
                  value={goodThreshold}
                  onChange={(e) => setGoodThreshold(Number(e.target.value))}
                  min={0}
                  max={100}
                />
                <p className="text-xs text-muted-foreground">마진율 이 이상 = 적합</p>
              </div>

              <div className="space-y-2">
                <Label>보통 기준 (%)</Label>
                <Input
                  type="number"
                  value={normalThreshold}
                  onChange={(e) => setNormalThreshold(Number(e.target.value))}
                  min={0}
                  max={100}
                />
                <p className="text-xs text-muted-foreground">마진율 이 이상 = 보통</p>
              </div>

              <div className="space-y-2">
                <Label>기본 배송비 (원)</Label>
                <Input
                  type="number"
                  value={defaultShipping}
                  onChange={(e) => setDefaultShipping(Number(e.target.value))}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">엑셀에 없을 때 적용</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 업로드 & 액션 */}
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={getFileAcceptTypes()}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            엑셀 업로드
          </Button>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            양식 다운로드
          </Button>
          <Button variant="outline" onClick={handleAddManual}>
            <Plus className="h-4 w-4 mr-2" />
            직접 입력
          </Button>
          {items.length > 0 && (
            <>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                결과 다운로드
              </Button>
              <Button variant="ghost" onClick={handleClearAll} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                전체 삭제
              </Button>
            </>
          )}
        </div>

        {/* 요약 카드 */}
        {analyzed.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">전체</p>
              <p className="text-2xl font-bold">{summary.total}개</p>
            </div>
            <div className="bg-[#D6F74C]/15 rounded-2xl p-4 text-center">
              <p className="text-xs font-medium text-[#6b7a1a] mb-1">적합</p>
              <p className="text-2xl font-bold text-[#6b7a1a]">{summary.good}개</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <p className="text-xs font-medium text-amber-600 mb-1">보통</p>
              <p className="text-2xl font-bold text-amber-600">{summary.normal}개</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center">
              <p className="text-xs font-medium text-red-600 mb-1">부적합</p>
              <p className="text-2xl font-bold text-red-600">{summary.bad}개</p>
            </div>
            <div className="bg-[#8C9EFF]/12 rounded-2xl p-4 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">평균 마진율</p>
              <p className="text-2xl font-bold">{summary.avgMargin.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {/* 결과 테이블 */}
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-1">엑셀 파일을 업로드하거나 직접 입력하세요</p>
              <p className="text-xs text-muted-foreground">
                엑셀 컬럼: 상품명, 원가, 판매가 (배송비는 선택)
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">상품명</TableHead>
                    <TableHead className="text-right min-w-[100px]">원가</TableHead>
                    <TableHead className="text-right min-w-[100px]">판매가</TableHead>
                    <TableHead className="text-right">배송비</TableHead>
                    <TableHead className="text-right">수수료</TableHead>
                    <TableHead className="text-right">순이익</TableHead>
                    <TableHead className="text-right">마진율</TableHead>
                    <TableHead className="text-center">판정</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyzed.map((item) => {
                    const vc = VERDICT_CONFIG[item.verdict];
                    const VerdictIcon = vc.icon;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                            className="h-8 min-w-[120px]"
                            placeholder="상품명"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.cost || ''}
                            onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)}
                            className="h-8 w-24 text-right"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.sellingPrice || ''}
                            onChange={(e) => handleItemChange(item.id, 'sellingPrice', e.target.value)}
                            className="h-8 w-24 text-right"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.shippingCost || ''}
                            onChange={(e) => handleItemChange(item.id, 'shippingCost', e.target.value)}
                            className="h-8 w-20 text-right"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {item.sellingPrice > 0 ? formatCurrency(item.fee) : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${item.netProfit >= 0 ? 'text-[#6b7a1a]' : 'text-red-600'}`}>
                          {item.sellingPrice > 0 ? formatCurrency(item.netProfit) : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${vc.color}`}>
                          {item.sellingPrice > 0 ? `${item.marginRate.toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.sellingPrice > 0 ? (
                            <Badge className={`${vc.bg} ${vc.color} border-0 gap-1`}>
                              <VerdictIcon className="h-3 w-3" />
                              {vc.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

      </main>
    </div>
  );
}
