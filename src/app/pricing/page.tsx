import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Package, BarChart3, Calculator, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

const FREE_FEATURES = [
  { icon: Calculator, text: '마진 계산기 무제한 사용' },
  { icon: Package, text: '상품 10개까지 무료 등록' },
  { icon: BarChart3, text: '기본 기능 전체 이용' },
];

const PRO_FEATURES = [
  { icon: Calculator, text: '마진 계산기 무제한 사용' },
  { icon: Package, text: '상품 무제한 등록' },
  { icon: BarChart3, text: '전체 기능 무제한 이용' },
  { icon: Sparkles, text: '판매 장부 & 수익 리포트' },
  { icon: Zap, text: '시장조사 판별 도구' },
  { icon: Lock, text: '우선 고객 지원' },
];

export default function PricingPage() {
  return (
    <main className="bg-background min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* 헤딩 */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-[#4a5abf]/10 text-[#4a5abf] hover:bg-[#4a5abf]/15 border-[#4a5abf]/20 text-sm px-3 py-1">
            요금제
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            내 쇼핑몰에 맞는 플랜을 선택하세요
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            무료로 시작하고, 필요할 때 업그레이드하세요.
          </p>
        </div>

        {/* 플랜 카드 */}
        <div className="grid sm:grid-cols-2 gap-6 items-start">

          {/* FREE */}
          <div className="rounded-2xl border bg-card p-8 flex flex-col gap-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Free</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-4xl font-bold">무료</span>
              </div>
              <p className="text-sm text-muted-foreground">가입 즉시, 영구 무료</p>
            </div>

            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-emerald-500" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="block">
              <Button variant="outline" className="w-full h-11 font-semibold">
                무료로 시작하기
              </Button>
            </Link>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border-2 border-[#4a5abf] bg-card p-8 flex flex-col gap-6 relative shadow-lg shadow-[#4a5abf]/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-[#4a5abf] text-white hover:bg-[#4a5abf] px-4 py-1 text-xs font-semibold shadow">
                추천
              </Badge>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#4a5abf] uppercase tracking-wider mb-2">Pro</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-4xl font-bold">9,900</span>
                <span className="text-lg font-medium text-muted-foreground mb-0.5">원</span>
                <span className="text-sm text-muted-foreground mb-1">/ 월</span>
              </div>
              <p className="text-sm text-muted-foreground">연간 결제 시 20% 할인</p>
            </div>

            <ul className="space-y-3 flex-1">
              {PRO_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <span className="h-5 w-5 rounded-full bg-[#4a5abf]/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-[#4a5abf]" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="block">
              <Button className="w-full h-11 font-semibold bg-[#4a5abf] hover:bg-[#3a4aaf] shadow-sm shadow-[#4a5abf]/30">
                <Zap className="h-4 w-4 mr-2" />
                PRO 시작하기
              </Button>
            </Link>
          </div>
        </div>

        {/* 기능 비교표 */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-center mb-8">플랜 비교</h2>
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-6 py-4 font-semibold">기능</th>
                  <th className="text-center px-6 py-4 font-semibold w-28">Free</th>
                  <th className="text-center px-6 py-4 font-semibold w-28 text-[#4a5abf]">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { feature: '마진 계산기', free: '무제한', pro: '무제한' },
                  { feature: '상품 등록', free: '최대 10개', pro: '무제한' },
                  { feature: '판매 장부', free: true, pro: true },
                  { feature: '수익 리포트', free: true, pro: true },
                  { feature: '목표 설정', free: true, pro: true },
                  { feature: '시장조사 판별', free: '월 3회', pro: '무제한' },
                  { feature: '광고비 관리', free: true, pro: true },
                  { feature: '엑셀 가져오기', free: false, pro: true },
                  { feature: '우선 고객 지원', free: false, pro: true },
                ].map(({ feature, free, pro }) => (
                  <tr key={feature} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground">{feature}</td>
                    <td className="px-6 py-3.5 text-center">
                      <CellValue value={free} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <CellValue value={pro} isPro />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            궁금한 점이 있으신가요?{' '}
            <a href="mailto:support@platcal.com" className="text-[#4a5abf] hover:underline font-medium">
              문의하기
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

function CellValue({ value, isPro = false }: { value: boolean | string; isPro?: boolean }) {
  if (typeof value === 'string') {
    return (
      <span className={isPro ? 'font-semibold text-[#4a5abf]' : 'text-muted-foreground'}>
        {value}
      </span>
    );
  }
  if (value) {
    return (
      <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full mx-auto ${isPro ? 'bg-[#4a5abf]/10' : 'bg-emerald-500/10'}`}>
        <Check className={`h-3 w-3 ${isPro ? 'text-[#4a5abf]' : 'text-emerald-500'}`} />
      </span>
    );
  }
  return <span className="text-muted-foreground/40 text-base">—</span>;
}
