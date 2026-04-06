import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Package, BarChart3, Calculator, Lock, Sparkles, Crown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    id: 'free',
    label: 'Free',
    price: null,
    priceLabel: '무료',
    priceSub: '가입 즉시, 영구 무료',
    accent: 'emerald' as const,
    recommended: false,
    cta: '무료로 시작하기',
    ctaVariant: 'outline' as const,
    features: [
      '상품 10개까지 등록',
      '마진 계산기 무제한',
      '판매 장부 & 수익 리포트',
      '목표 설정 & 광고비 관리',
      '시장조사 판별 & 엑셀 가져오기',
      '전체 기능 이용 가능',
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: '9,900',
    priceLabel: null,
    priceSub: '연간 결제 시 20% 할인',
    accent: 'brand' as const,
    recommended: true,
    cta: 'PRO 시작하기',
    ctaVariant: 'brand' as const,
    features: [
      '상품 50개까지 등록',
      '마진 계산기 무제한',
      '판매 장부 & 수익 리포트',
      '목표 설정 & 광고비 관리',
      '시장조사 판별 & 엑셀 가져오기',
      '전체 기능 이용 가능',
    ],
  },
  {
    id: 'plus',
    label: 'Plus',
    price: '19,900',
    priceLabel: null,
    priceSub: '연간 결제 시 20% 할인',
    accent: 'violet' as const,
    recommended: false,
    cta: 'Plus 시작하기',
    ctaVariant: 'violet' as const,
    features: [
      '상품 300개까지 등록',
      '마진 계산기 무제한',
      '판매 장부 & 수익 리포트',
      '목표 설정 & 광고비 관리',
      '시장조사 판별 & 엑셀 가져오기',
      '전체 기능 이용 가능',
    ],
  },
] as const;

const ACCENT = {
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    check: 'bg-emerald-500/10',
    checkIcon: 'text-emerald-500',
    label: 'text-emerald-600',
    border: 'border',
    shadow: '',
  },
  brand: {
    badge: 'bg-[#4a5abf] text-white border-[#4a5abf]',
    check: 'bg-[#4a5abf]/10',
    checkIcon: 'text-[#4a5abf]',
    label: 'text-[#4a5abf]',
    border: 'border-2 border-[#4a5abf]',
    shadow: 'shadow-lg shadow-[#4a5abf]/10',
  },
  violet: {
    badge: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    check: 'bg-violet-500/10',
    checkIcon: 'text-violet-600',
    label: 'text-violet-600',
    border: 'border-2 border-violet-400',
    shadow: 'shadow-lg shadow-violet-500/10',
  },
} as const;

export default function PricingPage() {
  return (
    <main className="bg-background min-h-screen">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-20">
        {/* 헤딩 */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-[#4a5abf]/10 text-[#4a5abf] hover:bg-[#4a5abf]/15 border-[#4a5abf]/20 text-sm px-3 py-1">
            요금제
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            내 쇼핑몰에 맞는 플랜을 선택하세요
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            무료로 시작하고, 규모에 맞게 업그레이드하세요.
          </p>
        </div>

        {/* 플랜 카드 */}
        <div className="grid sm:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan) => {
            const a = ACCENT[plan.accent];
            return (
              <div
                key={plan.id}
                className={cn(
                  'rounded-2xl bg-card p-7 flex flex-col gap-6 relative',
                  a.border,
                  a.shadow,
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#4a5abf] text-white hover:bg-[#4a5abf] px-4 py-1 text-xs font-semibold shadow">
                      추천
                    </Badge>
                  </div>
                )}

                <div>
                  <p className={cn('text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5', a.label)}>
                    {plan.id === 'plus' && <Crown className="h-3.5 w-3.5" />}
                    {plan.label}
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    {plan.priceLabel ? (
                      <span className="text-4xl font-bold">{plan.priceLabel}</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-base font-medium text-muted-foreground mb-0.5">원</span>
                        <span className="text-sm text-muted-foreground mb-1">/ 월</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.priceSub}</p>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((text) => (
                    <li key={text} className="flex items-center gap-2.5 text-sm">
                      <span className={cn('h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0', a.check)}>
                        <Check className={cn('h-2.5 w-2.5', a.checkIcon)} />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>

                <Link href="/auth/signup" className="block">
                  {plan.ctaVariant === 'outline' && (
                    <Button variant="outline" className="w-full h-10 font-semibold text-sm">
                      {plan.cta}
                    </Button>
                  )}
                  {plan.ctaVariant === 'brand' && (
                    <Button className="w-full h-10 font-semibold text-sm bg-[#4a5abf] hover:bg-[#3a4aaf] shadow-sm shadow-[#4a5abf]/30">
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      {plan.cta}
                    </Button>
                  )}
                  {plan.ctaVariant === 'violet' && (
                    <Button className="w-full h-10 font-semibold text-sm bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-500/30">
                      <Crown className="h-3.5 w-3.5 mr-1.5" />
                      {plan.cta}
                    </Button>
                  )}
                </Link>
              </div>
            );
          })}
        </div>

        {/* 기능 비교표 */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-center mb-8">플랜 비교</h2>
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-5 py-4 font-semibold">기능</th>
                  <th className="text-center px-4 py-4 font-semibold w-24 text-emerald-600">Free</th>
                  <th className="text-center px-4 py-4 font-semibold w-24 text-[#4a5abf]">Pro</th>
                  <th className="text-center px-4 py-4 font-semibold w-24 text-violet-600">Plus</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(
                  [
                    { feature: '마진 계산기', free: '무제한', pro: '무제한', plus: '무제한' },
                    { feature: '상품 등록', free: '최대 10개', pro: '최대 50개', plus: '최대 300개' },
                    { feature: '판매 장부', free: true, pro: true, plus: true },
                    { feature: '수익 리포트', free: true, pro: true, plus: true },
                    { feature: '목표 설정', free: true, pro: true, plus: true },
                    { feature: '광고비 & 운영비', free: true, pro: true, plus: true },
                    { feature: '시장조사 판별', free: true, pro: true, plus: true },
                    { feature: '엑셀 가져오기', free: true, pro: true, plus: true },
                    { feature: '우선 고객 지원', free: true, pro: true, plus: true },
                  ] as { feature: string; free: boolean | string; pro: boolean | string; plus: boolean | string }[]
                ).map(({ feature, free, pro, plus }) => (
                  <tr key={feature} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 text-muted-foreground">{feature}</td>
                    <td className="px-4 py-3 text-center"><CellValue value={free} color="emerald" /></td>
                    <td className="px-4 py-3 text-center"><CellValue value={pro} color="brand" /></td>
                    <td className="px-4 py-3 text-center"><CellValue value={plus} color="violet" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 문의 */}
        <div className="mt-14 text-center">
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

function CellValue({ value, color }: { value: boolean | string; color: 'emerald' | 'brand' | 'violet' }) {
  const colorMap = {
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: 'text-emerald-500' },
    brand: { text: 'text-[#4a5abf]', bg: 'bg-[#4a5abf]/10', icon: 'text-[#4a5abf]' },
    violet: { text: 'text-violet-600', bg: 'bg-violet-500/10', icon: 'text-violet-600' },
  };
  const c = colorMap[color];

  if (typeof value === 'string') {
    return <span className={cn('font-medium text-xs', c.text)}>{value}</span>;
  }
  if (value) {
    return (
      <span className={cn('inline-flex items-center justify-center h-5 w-5 rounded-full mx-auto', c.bg)}>
        <Check className={cn('h-3 w-3', c.icon)} />
      </span>
    );
  }
  return <span className="text-muted-foreground/30 text-base">—</span>;
}
