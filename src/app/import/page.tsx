'use client';

import { useState, useRef } from 'react';
import { UserMenu } from '@/components/auth/UserMenu';
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
} from 'lucide-react';
import Link from 'next/link';

type ImportType = 'products' | 'sales' | 'advertising' | 'operating';

interface ImportResult {
  success: boolean;
  imported: number;
  total: number;
  errors?: string[];
}

const importTypes = [
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
    example: '상품명,채널,날짜,수량,단가\n티셔츠,smartstore,2024-01-15,5,29000\n청바지,coupang,2024-01-15,3,49000',
  },
  {
    id: 'advertising' as ImportType,
    name: '광고비',
    icon: DollarSign,
    description: '광고비 기록을 일괄 등록합니다',
    columns: ['채널', '날짜', '광고비 (필수)', '노출수', '클릭수', '전환수', '캠페인'],
    example: '채널,날짜,광고비,노출수,클릭수,전환수,캠페인\nsmartstore,2024-01-15,50000,10000,200,10,신상품 프로모션',
  },
  {
    id: 'operating' as ImportType,
    name: '운영비',
    icon: Wallet,
    description: '운영비 기록을 일괄 등록합니다',
    columns: ['날짜', '카테고리', '금액 (필수)', '설명'],
    example: '날짜,카테고리,금액,설명\n2024-01-15,packaging,30000,박스 구매\n2024-01-15,shipping,50000,택배비',
  },
];

export default function ImportPage() {
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedType) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', selectedType);

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          success: false,
          imported: 0,
          total: 0,
          errors: [data.error || 'Import failed'],
        });
      } else {
        setResult(data);
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        total: 0,
        errors: ['네트워크 오류가 발생했습니다'],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = (type: ImportType) => {
    const importType = importTypes.find(t => t.id === type);
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
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold">마진 계산기</Link>
            <nav className="hidden sm:flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">대시보드</Button>
              </Link>
              <Link href="/import">
                <Button variant="ghost" size="sm" className="bg-gray-100">데이터 가져오기</Button>
              </Link>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">데이터 가져오기</h1>
            <p className="text-muted-foreground">CSV 파일로 데이터를 일괄 등록합니다</p>
          </div>
        </div>

        {/* 데이터 유형 선택 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {importTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;

            return (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/50'
                }`}
                onClick={() => {
                  setSelectedType(type.id);
                  resetForm();
                }}
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

        {/* 선택된 유형의 상세 정보 */}
        {selectedType && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {importTypes.find(t => t.id === selectedType)?.name} 가져오기
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate(selectedType)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  템플릿 다운로드
                </Button>
              </div>
              <CardDescription>
                CSV 파일의 첫 번째 행은 헤더여야 합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 필요한 열 정보 */}
              <div>
                <Label className="text-sm font-medium">필요한 열</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {importTypes.find(t => t.id === selectedType)?.columns.map((col) => (
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

              {/* 파일 업로드 */}
              <div className="space-y-4">
                <Label htmlFor="file">CSV 파일 선택</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    파일 선택
                  </Button>
                  {file && (
                    <span className="text-sm text-muted-foreground">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
              </div>

              {/* 업로드 버튼 */}
              <Button
                onClick={handleUpload}
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

        {/* 안내 사항 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">안내 사항</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>CSV 파일은 UTF-8 인코딩이어야 합니다</li>
              <li>엑셀에서 저장 시 &quot;CSV UTF-8 (쉼표로 분리)&quot; 형식을 선택하세요</li>
              <li>판매 기록 가져오기 시 상품이 먼저 등록되어 있어야 합니다</li>
              <li>날짜 형식은 YYYY-MM-DD (예: 2024-01-15) 입니다</li>
              <li>채널명: smartstore, coupang, gmarket, auction, 11st, ably, zigzag 등</li>
              <li>운영비 카테고리: packaging, shipping, labor, warehouse, utility, equipment, software, tax, insurance, other</li>
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
                  <CheckCircle className="h-5 w-5 text-green-600" />
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
            <AlertDialogAction onClick={() => {
              setResult(null);
              resetForm();
            }}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
