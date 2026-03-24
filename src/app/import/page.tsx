'use client';

import { useState, useRef, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Package,
  Receipt,
  DollarSign,
  Wallet,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Store,
  BarChart3,
  Eye,
  Trash2,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { readFile, getFileAcceptTypes, type SheetData } from '@/lib/excel-reader';
import { filterPersonalInfo, getPersonalInfoColumns, type FilterResult } from '@/lib/privacy-filter';
import { detectMarket, parseMarketData, getAvailableMarkets, type ParsedMarketData } from '@/lib/market-parsers';

type ImportMode = 'market' | 'custom';
type ImportType = 'products' | 'sales' | 'advertising' | 'operating';

interface ImportResult {
  success: boolean;
  imported: number;
  total: number;
  errors?: string[];
}

const customImportTypes = [
  {
    id: 'products' as ImportType,
    name: '상품',
    icon: Package,
    description: '상품 정보를 일괄 등록합니다',
    columns: ['상품명 (필수)', 'SKU', '원가'],
    example: '상품명,SKU,원가\n티셔츠,TS-001,15000\n청바지,JN-002,25000',
  },
  {
    id: 'sales' as ImportType,
    name: '판매 기록',
    icon: Receipt,
    description: '판매 기록을 일괄 등록합니다',
    columns: ['상품명 또는 SKU (필수)', '채널', '날짜', '수량', '단가'],
    example: '상품명,채널,날짜,수량,단가\n티셔츠,smartstore,2024-01-15,5,29000',
  },
  {
    id: 'advertising' as ImportType,
    name: '광고비',
    icon: DollarSign,
    description: '광고비 기록을 일괄 등록합니다',
    columns: ['채널', '날짜', '광고비 (필수)', '노출수', '클릭수', '전환수', '캠페인'],
    example: '채널,날짜,광고비,노출수,클릭수,전환수,캠페인\nsmartstore,2024-01-15,50000,10000,200,10,프로모션',
  },
  {
    id: 'operating' as ImportType,
    name: '운영비',
    icon: Wallet,
    description: '운영비 기록을 일괄 등록합니다',
    columns: ['날짜', '카테고리', '금액 (필수)', '설명'],
    example: '날짜,카테고리,금액,설명\n2024-01-15,packaging,30000,박스 구매',
  },
];

const availableMarkets = getAvailableMarkets();

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
}

export default function ImportPage() {
  const [importMode, setImportMode] = useState<ImportMode>('market');
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [sheetData, setSheetData] = useState<SheetData[] | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [marketData, setMarketData] = useState<ParsedMarketData | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (selectedFile: File) => {
    setIsProcessing(true);
    setSheetData(null);
    setFilterResult(null);
    setMarketData(null);
    setPreviewVisible(false);

    try {
      const sheets = await readFile(selectedFile);
      if (sheets.length === 0 || sheets[0].rows.length === 0) {
        alert('파일에 데이터가 없습니다.');
        setIsProcessing(false);
        return;
      }

      setSheetData(sheets);
      setActiveSheet(0);

      const currentSheet = sheets[0];
      const privacy = filterPersonalInfo(currentSheet.rows, currentSheet.headers);
      setFilterResult(privacy);

      if (importMode === 'market') {
        const safeHeaders = currentSheet.headers.filter(
          h => !privacy.removedColumns.includes(h)
        );
        const detected = detectMarket(currentSheet.headers);
        if (detected && !selectedMarket) {
          setSelectedMarket(detected.channel);
        }
        const parsed = parseMarketData(
          privacy.filteredData,
          safeHeaders,
          selectedMarket || detected?.channel
        );
        setMarketData(parsed);
      }

      setPreviewVisible(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [importMode, selectedMarket]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      await processFile(selectedFile);
    }
  };

  const handleMarketUpload = async () => {
    if (!marketData || !filterResult) return;

    setIsUploading(true);
    setResult(null);

    try {
      const safeCsvRows: string[] = [];
      const safeData = filterResult.filteredData;

      if (safeData.length === 0) {
        setResult({ success: false, imported: 0, total: 0, errors: ['필터링 후 데이터가 없습니다.'] });
        return;
      }

      const headers = Object.keys(safeData[0]);
      safeCsvRows.push(headers.join(','));
      for (const row of safeData) {
        safeCsvRows.push(headers.map(h => {
          const val = row[h] || '';
          return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(','));
      }

      const csvBlob = new Blob(['\uFEFF' + safeCsvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
      const csvFile = new File([csvBlob], 'filtered_data.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('type', 'sales');
      formData.append('market', selectedMarket || 'unknown');

      const res = await fetch('/api/import/market', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, imported: 0, total: 0, errors: [data.error || '업로드 실패'] });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ success: false, imported: 0, total: 0, errors: ['네트워크 오류가 발생했습니다'] });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCustomUpload = async () => {
    if (!file || !selectedType) return;

    setIsUploading(true);
    setResult(null);

    try {
      let uploadData: string;

      if (filterResult && filterResult.filteredData.length > 0) {
        const safeData = filterResult.filteredData;
        const headers = Object.keys(safeData[0]);
        const csvRows = [headers.join(',')];
        for (const row of safeData) {
          csvRows.push(headers.map(h => {
            const val = row[h] || '';
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(','));
        }
        uploadData = csvRows.join('\n');
      } else {
        uploadData = await file.text();
      }

      const csvBlob = new Blob(['\uFEFF' + uploadData], { type: 'text/csv;charset=utf-8' });
      const csvFile = new File([csvBlob], 'data.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('type', selectedType);

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, imported: 0, total: 0, errors: [data.error || '업로드 실패'] });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ success: false, imported: 0, total: 0, errors: ['네트워크 오류가 발생했습니다'] });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = (type: ImportType) => {
    const importType = customImportTypes.find(t => t.id === type);
    if (!importType) return;
    const blob = new Blob(['\uFEFF' + importType.example], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setSheetData(null);
    setFilterResult(null);
    setMarketData(null);
    setPreviewVisible(false);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const personalInfoCols = sheetData && sheetData[activeSheet]
    ? getPersonalInfoColumns(sheetData[activeSheet].headers)
    : [];

  return (
    <div className="bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">데이터 가져오기</h1>
            <p className="text-muted-foreground">마켓 정산 엑셀 또는 CSV 파일을 업로드하세요</p>
          </div>
        </div>

        {/* 개인정보 보호 안내 */}
        <Card className="border-[#8C9EFF]/30 bg-[#8C9EFF]/10">
          <CardContent className="flex items-start gap-3 pt-4">
            <ShieldCheck className="h-5 w-5 text-[#4a5abf] mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-[#4a5abf]">개인정보 보호</p>
              <p className="text-[#4a5abf] mt-1">
                업로드된 파일은 브라우저에서 처리되며, 주소/전화번호/이름 등 개인정보는
                <strong> 자동으로 감지하여 서버 전송 전에 제거</strong>됩니다.
                개인정보가 서버에 저장되지 않습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 모드 선택 */}
        <div className="flex gap-2">
          <Button
            variant={importMode === 'market' ? 'default' : 'outline'}
            onClick={() => { setImportMode('market'); resetForm(); }}
            className="flex-1 sm:flex-none"
          >
            <Store className="h-4 w-4 mr-2" />
            마켓 정산 데이터
          </Button>
          <Button
            variant={importMode === 'custom' ? 'default' : 'outline'}
            onClick={() => { setImportMode('custom'); resetForm(); }}
            className="flex-1 sm:flex-none"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            직접 입력 (CSV)
          </Button>
        </div>

        {/* 마켓 정산 모드 */}
        {importMode === 'market' && (
          <>
            {/* 마켓 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">마켓 / 솔루션 선택</CardTitle>
                <CardDescription>
                  정산 데이터를 가져올 마켓 또는 통합 솔루션을 선택하세요. 파일 업로드 시 자동 감지도 됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" />
                    개별 마켓
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableMarkets.filter(m => !m.isSolution).map(market => (
                      <button
                        key={market.channel}
                        onClick={() => {
                          setSelectedMarket(market.channel);
                          if (file) processFile(file);
                        }}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          selectedMarket === market.channel
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <Store className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-sm font-medium">{market.name}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedMarket(null);
                        if (file) processFile(file);
                      }}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        selectedMarket === null
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <BarChart3 className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">자동 감지</span>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    통합 솔루션
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableMarkets.filter(m => m.isSolution).map(market => (
                      <button
                        key={market.channel}
                        onClick={() => {
                          setSelectedMarket(market.channel);
                          if (file) processFile(file);
                        }}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          selectedMarket === market.channel
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <Layers className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-sm font-medium">{market.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    통합 솔루션 파일은 여러 마켓 데이터를 포함하며, 판매처/쇼핑몰 컬럼을 기준으로 자동 분류됩니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 파일 업로드 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">파일 업로드</CardTitle>
                <CardDescription>
                  마켓 셀러센터에서 다운로드한 엑셀(.xlsx) 또는 CSV 파일을 업로드하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={getFileAcceptTypes()}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isProcessing ? '처리 중...' : '파일 선택'}
                  </Button>
                  {file && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {sheetData && sheetData.length > 1 && (
                  <div>
                    <Label className="text-sm font-medium">시트 선택</Label>
                    <div className="flex gap-2 mt-2">
                      {sheetData.map((sheet, idx) => (
                        <Button
                          key={idx}
                          variant={activeSheet === idx ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveSheet(idx)}
                        >
                          {sheet.sheetName}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 개인정보 필터링 결과 */}
            {filterResult && filterResult.removedColumns.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                    <ShieldCheck className="h-5 w-5" />
                    개인정보 필터링 완료
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filterResult.warnings.map((w, i) => (
                      <p key={i} className="text-sm text-amber-700">{w}</p>
                    ))}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filterResult.removedColumns.map(col => (
                        <span key={col} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded line-through">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 마켓 분석 결과 */}
            {marketData && previewVisible && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      분석 결과 — {marketData.marketName}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewVisible(!previewVisible)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {previewVisible ? '접기' : '펼치기'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {marketData.warnings.length > 0 && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      {marketData.warnings.map((w, i) => (
                        <p key={i} className="text-sm text-yellow-700">⚠ {w}</p>
                      ))}
                    </div>
                  )}

                  {/* 요약 통계 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-blue-600">총 건수</p>
                      <p className="text-lg font-bold text-blue-800">
                        {marketData.summary.totalOrders.toLocaleString()}건
                      </p>
                    </div>
                    <div className="bg-[#8C9EFF]/10 p-3 rounded-lg text-center">
                      <p className="text-xs text-[#4a5abf]">총 매출</p>
                      <p className="text-lg font-bold text-[#4a5abf]">
                        {formatCurrency(marketData.summary.totalRevenue)}
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-red-600">총 수수료</p>
                      <p className="text-lg font-bold text-red-800">
                        {formatCurrency(marketData.summary.totalFees)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-purple-600">정산 금액</p>
                      <p className="text-lg font-bold text-purple-800">
                        {formatCurrency(marketData.summary.totalSettlement)}
                      </p>
                    </div>
                  </div>

                  {marketData.summary.period.start && (
                    <p className="text-sm text-muted-foreground text-center">
                      기간: {marketData.summary.period.start} ~ {marketData.summary.period.end}
                    </p>
                  )}

                  {/* 주문 데이터 미리보기 */}
                  {marketData.orders.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">주문 데이터 미리보기 (상위 10건)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border p-2 text-left">주문일</th>
                              <th className="border p-2 text-left">상품명</th>
                              <th className="border p-2 text-right">수량</th>
                              <th className="border p-2 text-right">금액</th>
                              <th className="border p-2 text-right">수수료</th>
                              <th className="border p-2 text-left">상태</th>
                            </tr>
                          </thead>
                          <tbody>
                            {marketData.orders.slice(0, 10).map((order, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="border p-2">{order.orderDate}</td>
                                <td className="border p-2 max-w-[200px] truncate">{order.productName}</td>
                                <td className="border p-2 text-right">{order.quantity}</td>
                                <td className="border p-2 text-right">{formatCurrency(order.totalAmount)}</td>
                                <td className="border p-2 text-right">{formatCurrency(order.platformFee)}</td>
                                <td className="border p-2">{order.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {marketData.orders.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ... 외 {marketData.orders.length - 10}건
                        </p>
                      )}
                    </div>
                  )}

                  {/* 정산 데이터 미리보기 */}
                  {marketData.settlements.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">정산 데이터 미리보기 (상위 10건)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border p-2 text-left">정산일</th>
                              <th className="border p-2 text-left">상품명</th>
                              <th className="border p-2 text-right">매출</th>
                              <th className="border p-2 text-right">수수료</th>
                              <th className="border p-2 text-right">정산액</th>
                            </tr>
                          </thead>
                          <tbody>
                            {marketData.settlements.slice(0, 10).map((s, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="border p-2">{s.settlementDate}</td>
                                <td className="border p-2 max-w-[200px] truncate">{s.productName}</td>
                                <td className="border p-2 text-right">{formatCurrency(s.saleAmount)}</td>
                                <td className="border p-2 text-right">{formatCurrency(s.platformFee)}</td>
                                <td className="border p-2 text-right">{formatCurrency(s.settlementAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {marketData.settlements.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ... 외 {marketData.settlements.length - 10}건
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleMarketUpload}
                    disabled={isUploading || (marketData.orders.length === 0 && marketData.settlements.length === 0)}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        분석 데이터 저장하기
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* 직접 입력 모드 */}
        {importMode === 'custom' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customImportTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/50'
                    }`}
                    onClick={() => { setSelectedType(type.id); resetForm(); }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{type.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedType && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {customImportTypes.find(t => t.id === selectedType)?.name} 가져오기
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => downloadTemplate(selectedType)}>
                      <Download className="h-4 w-4 mr-2" />
                      템플릿 다운로드
                    </Button>
                  </div>
                  <CardDescription>엑셀(.xlsx) 또는 CSV 파일의 첫 번째 행은 헤더여야 합니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium">필요한 열</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customImportTypes.find(t => t.id === selectedType)?.columns.map((col) => (
                        <span
                          key={col}
                          className={`px-2 py-1 text-sm rounded ${
                            col.includes('필수') ? 'bg-primary/10 text-primary' : 'bg-gray-100'
                          }`}
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="file">파일 선택</Label>
                    <div className="flex items-center gap-4">
                      <input
                        ref={fileInputRef}
                        id="file"
                        type="file"
                        accept={getFileAcceptTypes()}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                        )}
                        {isProcessing ? '처리 중...' : '파일 선택'}
                      </Button>
                      {file && (
                        <span className="text-sm text-muted-foreground">
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                  </div>

                  {filterResult && filterResult.removedColumns.length > 0 && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p className="text-sm font-medium text-amber-800 flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" /> 개인정보 필터링됨
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        제거된 열: {filterResult.removedColumns.join(', ')}
                      </p>
                    </div>
                  )}

                  {sheetData && previewVisible && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">데이터 미리보기 (상위 5건)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              {sheetData[activeSheet].headers
                                .filter(h => !personalInfoCols.includes(h))
                                .slice(0, 8)
                                .map(h => (
                                  <th key={h} className="border p-2 text-left">{h}</th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(filterResult?.filteredData || sheetData[activeSheet].rows).slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                {Object.keys(row).slice(0, 8).map(key => (
                                  <td key={key} className="border p-2 max-w-[150px] truncate">{row[key]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleCustomUpload}
                    disabled={!file || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        가져오는 중...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        데이터 가져오기
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* 안내 사항 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">안내 사항</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>엑셀(.xlsx) 및 CSV 파일을 지원합니다</li>
              <li>마켓 정산 데이터는 각 마켓 셀러센터에서 다운로드하세요</li>
              <li>개인정보(주소, 전화번호, 이름 등)는 자동으로 감지하여 제거됩니다</li>
              <li>파일은 브라우저에서 처리되며, 개인정보가 포함된 원본은 서버로 전송되지 않습니다</li>
              <li>지원 마켓: 쿠팡, 스마트스토어(네이버), 11번가, G마켓/옥션, 지그재그, 에이블리</li>
              <li>지원 솔루션: 이지어드민, 셀메이트, 사방넷 (주문/정산 엑셀)</li>
              <li>통합 솔루션 파일은 판매처/쇼핑몰 컬럼으로 채널을 자동 분류합니다</li>
              <li>마켓이 자동 감지되지 않을 경우 직접 선택해주세요</li>
            </ul>
          </CardContent>
        </Card>
      </main>

      {/* 결과 다이얼로그 */}
      <AlertDialog open={!!result} onOpenChange={() => setResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {result?.success && result.imported > 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-[#4a5abf]" />
                  가져오기 완료
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  가져오기 결과
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              총 {result?.total}건 중 {result?.imported}건을 성공적으로 가져왔습니다.
            </AlertDialogDescription>
            {result?.errors && result.errors.length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg mt-4">
                <p className="font-medium text-red-600 mb-2">오류 ({result.errors.length}건)</p>
                <ul className="text-sm text-red-600 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => { setResult(null); resetForm(); }}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
