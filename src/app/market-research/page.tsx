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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  PackagePlus,
  ChevronRight,
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
  feeRate: number;
  netProfit: number;
  marginRate: number;
  salesVat: number;
  totalPurchaseVat: number;
  vatPayable: number;
  verdict: 'good' | 'normal' | 'bad';
}

type Verdict = 'good' | 'normal' | 'bad';

const VERDICT_CONFIG: Record<Verdict, { label: string; icon: typeof CheckCircle; color: string; bg: string; border: string }> = {
  good: { label: '적합', icon: CheckCircle, color: 'text-[#4a5abf]', bg: 'bg-[#8C9EFF]/15', border: 'border-[#8C9EFF]/40' },
  normal: { label: '보통', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  bad: { label: '부적합', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

export default function MarketResearchPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [platformPresets, setPlatformPresets] = useState<Record<SalesChannel, PlatformPreset>>(PLATFORM_PRESETS);
  const [channel, setChannel] = useState<SalesChannel>('smartstore');
  const [subOptionId, setSubOptionId] = useState<string | null>(null);
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
  const currentSubOptions = useMemo(() => preset?.subOptions || [], [preset]);

  const selectedSubOption = useMemo(() => {
    if (!subOptionId) return null;
    return currentSubOptions.find(opt => opt.id === subOptionId) || null;
  }, [currentSubOptions, subOptionId]);

  const activePlatformFeeRate = selectedSubOption?.platformFeeRate ?? preset.platformFeeRate;
  const activePaymentFeeRate = selectedSubOption?.paymentFeeRate ?? preset.paymentFeeRate;
  const totalFeeRate = activePlatformFeeRate + activePaymentFeeRate;

  const handleChannelChange = useCallback((newChannel: SalesChannel) => {
    setChannel(newChannel);
    setSubOptionId(null);
  }, []);

  const handleSubOptionChange = useCallback((optionId: string) => {
    setSubOptionId(prev => prev === optionId ? null : optionId);
  }, []);

  const analyzeItem = useCallback((item: ResearchItem): AnalyzedItem => {
    const inputs: CalculatorInputs = {
      sellingPrice: item.sellingPrice,
      productCost: item.cost,
      discountRate: 0,
      discountAmount: 0,
      platformFeeRate: activePlatformFeeRate,
      paymentFeeRate: activePaymentFeeRate,
      couponBurden: 0,
      sellerShippingCost: item.shippingCost || defaultShipping,
      customerShippingCost: 0,
      packagingCost: 0,
      materialCost: 0,
      advertisingCost: 0,
      otherCosts: 0,
      sellingPriceVatIncluded: true,
      wholesaleVatType: 'included',
      targetMarginRate: 30,
    };

    try {
      const result = calculateMargin(inputs);
      const fee = result.platformFee + result.paymentFee;
      let verdict: Verdict = 'bad';
      if (result.marginRate >= goodThreshold) verdict = 'good';
      else if (result.marginRate >= normalThreshold) verdict = 'normal';

      return {
        ...item, fee, feeRate: totalFeeRate, netProfit: result.netProfit, marginRate: result.marginRate,
        salesVat: result.salesVat, totalPurchaseVat: result.totalPurchaseVat, vatPayable: result.vatPayable,
        verdict,
      };
    } catch {
      return { ...item, fee: 0, feeRate: totalFeeRate, netProfit: 0, marginRate: 0, salesVat: 0, totalPurchaseVat: 0, vatPayable: 0, verdict: 'bad' };
    }
  }, [activePlatformFeeRate, activePaymentFeeRate, totalFeeRate, defaultShipping, goodThreshold, normalThreshold]);

  const analyzed = useMemo(() => items.map(analyzeItem), [items, analyzeItem]);

  const summary = useMemo(() => {
    const good = analyzed.filter(i => i.verdict === 'good').length;
    const normal = analyzed.filter(i => i.verdict === 'normal').length;
    const bad = analyzed.filter(i => i.verdict === 'bad').length;
    const avgMargin = analyzed.length > 0
      ? analyzed.reduce((s, i) => s + i.marginRate, 0) / analyzed.length
      : 0;
    const totalVatPayable = analyzed.reduce((s, i) => s + i.vatPayable, 0);
    return { total: analyzed.length, good, normal, bad, avgMargin, totalVatPayable };
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
    } catch {
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
      '원가(VAT포함)': item.cost,
      '판매가': item.sellingPrice,
      '배송비': item.shippingCost,
      '수수료': Math.round(item.fee),
      '수수료율(%)': Number(item.feeRate.toFixed(2)),
      '매출부가세': Math.round(item.salesVat),
      '매입부가세': Math.round(item.totalPurchaseVat),
      '납부부가세': Math.round(item.vatPayable),
      '순이익': Math.round(item.netProfit),
      '마진율(%)': Number(item.marginRate.toFixed(1)),
      '판정': VERDICT_CONFIG[item.verdict].label,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '시장조사 분석');
    XLSX.writeFile(wb, `시장조사_분석_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [analyzed]);

  const [addingProductIds, setAddingProductIds] = useState<Set<string>>(new Set());
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ success: number; fail: number } | null>(null);

  const addSingleProduct = useCallback(async (item: AnalyzedItem) => {
    setAddingProductIds(prev => new Set(prev).add(item.id));
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name || '이름 없는 상품',
          base_cost: item.cost,
          markets: [{
            channel,
            sub_option_id: subOptionId,
            selling_price: item.sellingPrice,
            platform_fee_rate: activePlatformFeeRate,
            payment_fee_rate: activePaymentFeeRate,
            additional_costs: { shipping: item.shippingCost },
          }],
        }),
      });
      if (res.ok) {
        setAddedProductIds(prev => new Set(prev).add(item.id));
      }
    } catch { /* ignore */ }
    setAddingProductIds(prev => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  }, [channel, subOptionId, activePlatformFeeRate, activePaymentFeeRate]);

  const handleBulkAdd = useCallback(async (targetVerdict: 'good' | 'all') => {
    const targets = targetVerdict === 'good'
      ? analyzed.filter(i => i.verdict === 'good' && !addedProductIds.has(i.id))
      : analyzed.filter(i => !addedProductIds.has(i.id));

    if (targets.length === 0) return;
    setBulkAdding(true);
    setBulkResult(null);

    let success = 0;
    let fail = 0;

    for (const item of targets) {
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name || '이름 없는 상품',
            base_cost: item.cost,
            markets: [{
              channel,
              sub_option_id: subOptionId,
              selling_price: item.sellingPrice,
              platform_fee_rate: activePlatformFeeRate,
              payment_fee_rate: activePaymentFeeRate,
              additional_costs: { shipping: item.shippingCost },
            }],
          }),
        });
        if (res.ok) {
          success++;
          setAddedProductIds(prev => new Set(prev).add(item.id));
        } else {
          fail++;
        }
      } catch {
        fail++;
      }
    }

    setBulkResult({ success, fail });
    setBulkAdding(false);
  }, [analyzed, addedProductIds, channel, subOptionId, activePlatformFeeRate, activePaymentFeeRate]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const subOptionTags = Array.from(new Set(currentSubOptions.map(o => o.tag).filter(Boolean)));

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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>판매 채널</Label>
                <Select value={channel} onValueChange={(v) => handleChannelChange(v as SalesChannel)}>
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

            {/* 하위 옵션 (카테고리/유입경로 등) */}
            {currentSubOptions.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>카테고리 / 판매방식 선택 (수수료 세분화)</span>
                </div>
                {subOptionTags.length > 1 ? (
                  subOptionTags.map(tag => (
                    <div key={tag} className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">{tag}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentSubOptions.filter(o => o.tag === tag).map((option) => {
                          const rate = Math.round((option.platformFeeRate + option.paymentFeeRate) * 100) / 100;
                          return (
                            <Button
                              key={option.id}
                              variant={subOptionId === option.id ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleSubOptionChange(option.id)}
                              className="text-xs h-7"
                            >
                              {option.name}
                              <span className="ml-1 opacity-70">({rate}%)</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {currentSubOptions.map((option) => {
                      const rate = Math.round((option.platformFeeRate + option.paymentFeeRate) * 100) / 100;
                      return (
                        <Button
                          key={option.id}
                          variant={subOptionId === option.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleSubOptionChange(option.id)}
                          className="text-xs h-7"
                        >
                          {option.name}
                          <span className="ml-1 opacity-70">({rate}%)</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
                {selectedSubOption && (
                  <div className="p-2.5 bg-[#8C9EFF]/10 border border-[#8C9EFF]/30 rounded-xl text-xs">
                    <span className="font-medium">적용 수수료:</span>{' '}
                    플랫폼 {activePlatformFeeRate}% + 결제 {activePaymentFeeRate}% ={' '}
                    <span className="font-bold">합계 {totalFeeRate.toFixed(2)}%</span>
                    {selectedSubOption.description && (
                      <span className="text-muted-foreground ml-2">· {selectedSubOption.description}</span>
                    )}
                  </div>
                )}
              </div>
            )}
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
              {summary.good > 0 && (
                <Button
                  variant="outline"
                  onClick={() => { setBulkResult(null); setBulkAddOpen(true); }}
                  className="border-[#8C9EFF]/50 text-[#4a5abf] hover:bg-[#8C9EFF]/10"
                >
                  <PackagePlus className="h-4 w-4 mr-2" />
                  적합 상품 추가 ({summary.good - analyzed.filter(i => i.verdict === 'good' && addedProductIds.has(i.id)).length}개)
                </Button>
              )}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">전체</p>
              <p className="text-2xl font-bold">{summary.total}개</p>
            </div>
            <div className="bg-[#8C9EFF]/15 rounded-2xl p-4 text-center">
              <p className="text-xs font-medium text-[#4a5abf] mb-1">적합</p>
              <p className="text-2xl font-bold text-[#4a5abf]">{summary.good}개</p>
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
            <div className="bg-blue-50 rounded-2xl p-4 text-center">
              <p className="text-xs font-medium text-blue-600 mb-1">납부부가세 합계</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalVatPayable)}</p>
            </div>
          </div>
        )}

        {/* 결과: 데스크톱=테이블, 모바일=카드 */}
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
          <>
            {/* 데스크톱 테이블 */}
            <Card className="hidden sm:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">상품명</TableHead>
                      <TableHead className="text-right min-w-[100px]">원가<span className="text-[10px] text-muted-foreground ml-0.5">(VAT포함)</span></TableHead>
                      <TableHead className="text-right min-w-[100px]">판매가</TableHead>
                      <TableHead className="text-right">배송비</TableHead>
                      <TableHead className="text-right">수수료</TableHead>
                      <TableHead className="text-right">납부VAT</TableHead>
                      <TableHead className="text-right">순이익</TableHead>
                      <TableHead className="text-right">마진율</TableHead>
                      <TableHead className="text-center">판정</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
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
                          <TableCell
                            className="text-right text-sm text-muted-foreground cursor-help"
                            title={item.sellingPrice > 0 ? `매출부가세: ${formatCurrency(item.salesVat)}\n매입부가세: ${formatCurrency(item.totalPurchaseVat)}\n납부부가세: ${formatCurrency(item.vatPayable)}` : ''}
                          >
                            {item.sellingPrice > 0 ? formatCurrency(item.vatPayable) : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${item.netProfit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
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
                            <div className="flex items-center gap-0.5">
                              {addedProductIds.has(item.id) ? (
                                <span title="등록 완료">
                                  <CheckCircle className="h-4 w-4 text-[#4a5abf]" />
                                </span>
                              ) : item.sellingPrice > 0 && item.name ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="상품관리에 추가"
                                  onClick={() => addSingleProduct(item)}
                                  disabled={addingProductIds.has(item.id)}
                                >
                                  {addingProductIds.has(item.id) ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <PackagePlus className="h-3.5 w-3.5 text-primary" />
                                  )}
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* 모바일 카드 뷰 */}
            <div className="sm:hidden space-y-3">
              {analyzed.map((item) => {
                const vc = VERDICT_CONFIG[item.verdict];
                const VerdictIcon = vc.icon;
                const hasResult = item.sellingPrice > 0;
                return (
                  <Card key={item.id} className={`overflow-hidden ${hasResult ? vc.border : ''}`}>
                    {/* 판정 헤더 */}
                    {hasResult && (
                      <div className={`${vc.bg} px-4 py-2 flex items-center justify-between`}>
                        <div className="flex items-center gap-1.5">
                          <VerdictIcon className={`h-4 w-4 ${vc.color}`} />
                          <span className={`text-sm font-bold ${vc.color}`}>{vc.label}</span>
                        </div>
                        <span className={`text-lg font-bold ${vc.color}`}>
                          {item.marginRate.toFixed(1)}%
                        </span>
                      </div>
                    )}

                    <CardContent className="pt-4 space-y-3">
                      {/* 상품명 */}
                      <Input
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="h-9"
                        placeholder="상품명 입력"
                      />

                      {/* 입력 필드: 2열 그리드 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">원가 (VAT포함)</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={item.cost || ''}
                            onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)}
                            className="h-9 text-right"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">판매가</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={item.sellingPrice || ''}
                            onChange={(e) => handleItemChange(item.id, 'sellingPrice', e.target.value)}
                            className="h-9 text-right"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">배송비</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={item.shippingCost || ''}
                            onChange={(e) => handleItemChange(item.id, 'shippingCost', e.target.value)}
                            className="h-9 text-right"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">수수료 ({totalFeeRate.toFixed(1)}%)</Label>
                          <div className="h-9 flex items-center justify-end px-3 bg-muted/50 rounded-md text-sm">
                            {hasResult ? formatCurrency(item.fee) : '-'}
                          </div>
                        </div>
                      </div>

                      {/* 결과 요약 */}
                      {hasResult && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">순이익</p>
                            <p className={`text-sm font-bold ${item.netProfit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}`}>
                              {formatCurrency(item.netProfit)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">납부VAT</p>
                            <p className="text-sm font-medium text-muted-foreground">
                              {formatCurrency(item.vatPayable)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">마진율</p>
                            <p className={`text-sm font-bold ${vc.color}`}>
                              {item.marginRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-2 pt-1">
                        {addedProductIds.has(item.id) ? (
                          <div className="flex items-center gap-1.5 text-sm text-[#4a5abf]">
                            <CheckCircle className="h-4 w-4" />
                            <span>등록 완료</span>
                          </div>
                        ) : hasResult && item.name ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => addSingleProduct(item)}
                            disabled={addingProductIds.has(item.id)}
                          >
                            {addingProductIds.has(item.id) ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <PackagePlus className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            상품 추가
                          </Button>
                        ) : null}
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-muted-foreground hover:text-red-600"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* 일괄 추가 다이얼로그 */}
        <Dialog open={bulkAddOpen} onOpenChange={setBulkAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>적합 상품 일괄 추가</DialogTitle>
              <DialogDescription>
                마진율 {goodThreshold}% 이상인 적합 상품을 상품관리에 일괄 등록합니다.
                채널({preset.name})과 수수료 설정이 함께 저장됩니다.
              </DialogDescription>
            </DialogHeader>

            {bulkResult ? (
              <div className="py-6 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-[#4a5abf]" />
                <p className="font-medium text-lg">{bulkResult.success}개 상품 등록 완료</p>
                {bulkResult.fail > 0 && (
                  <p className="text-sm text-red-600 mt-1">{bulkResult.fail}개 실패</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">상품관리에서 확인할 수 있습니다</p>
                <Button className="mt-4" variant="outline" onClick={() => setBulkAddOpen(false)}>닫기</Button>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">대상 상품</span>
                    <span className="font-medium">
                      {analyzed.filter(i => i.verdict === 'good' && !addedProductIds.has(i.id)).length}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">판매 채널</span>
                    <span>{preset.name}{selectedSubOption ? ` · ${selectedSubOption.name}` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수수료</span>
                    <span>{activePlatformFeeRate}% + {activePaymentFeeRate}% = {totalFeeRate.toFixed(2)}%</span>
                  </div>
                  {addedProductIds.size > 0 && (
                    <p className="text-xs text-muted-foreground pt-1 border-t">
                      이미 추가된 {addedProductIds.size}개 상품은 제외됩니다
                    </p>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setBulkAddOpen(false)}>취소</Button>
                  <Button
                    onClick={() => handleBulkAdd('good')}
                    disabled={bulkAdding}
                  >
                    {bulkAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PackagePlus className="h-4 w-4 mr-2" />}
                    {bulkAdding ? '등록 중...' : '일괄 등록'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
