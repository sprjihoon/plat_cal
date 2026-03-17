import { z } from 'zod';

// 숫자 문자열 변환 헬퍼
const numericString = z
  .string()
  .transform((val) => {
    const cleaned = val.replace(/,/g, '').trim();
    if (cleaned === '' || cleaned === '-') return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  });

// 퍼센트 값 검증 (0-100)
const percentageString = z
  .string()
  .transform((val) => {
    const cleaned = val.replace(/,/g, '').replace(/%/g, '').trim();
    if (cleaned === '' || cleaned === '-') return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  });

// 계산기 입력 스키마
export const calculatorInputSchema = z.object({
  // 기본 판매 정보
  sellingPrice: numericString.pipe(
    z.number().min(0, '판매가는 0 이상이어야 합니다')
  ),
  productCost: numericString.pipe(
    z.number().min(0, '상품 원가는 0 이상이어야 합니다')
  ),
  discountRate: percentageString.pipe(
    z.number().min(0, '할인율은 0 이상이어야 합니다').max(99.99, '할인율은 100% 미만이어야 합니다')
  ),
  discountAmount: numericString.pipe(
    z.number().min(0, '할인 금액은 0 이상이어야 합니다')
  ),

  // 수수료 정보
  platformFeeRate: percentageString.pipe(
    z.number().min(0, '플랫폼 수수료율은 0 이상이어야 합니다').max(100, '플랫폼 수수료율은 100% 이하여야 합니다')
  ),
  paymentFeeRate: percentageString.pipe(
    z.number().min(0, '결제 수수료율은 0 이상이어야 합니다').max(100, '결제 수수료율은 100% 이하여야 합니다')
  ),
  couponBurden: numericString.pipe(
    z.number().min(0, '쿠폰 부담금은 0 이상이어야 합니다')
  ),

  // 배송 및 포장 비용
  sellerShippingCost: numericString.pipe(
    z.number().min(0, '판매자 부담 배송비는 0 이상이어야 합니다')
  ),
  customerShippingCost: numericString.pipe(
    z.number().min(0, '고객 부담 배송비는 0 이상이어야 합니다')
  ),
  packagingCost: numericString.pipe(
    z.number().min(0, '포장비는 0 이상이어야 합니다')
  ),
  materialCost: numericString.pipe(
    z.number().min(0, '부자재비는 0 이상이어야 합니다')
  ),

  // 광고 및 기타 비용
  advertisingCost: numericString.pipe(
    z.number().min(0, '광고비는 0 이상이어야 합니다')
  ),
  otherCosts: numericString.pipe(
    z.number().min(0, '기타 비용은 0 이상이어야 합니다')
  ),

  // VAT 설정
  sellingPriceVatIncluded: z.boolean().default(true),
  wholesaleVatType: z.enum(['included', 'excluded']).default('included'),

  // 목표 마진율
  targetMarginRate: percentageString.pipe(
    z.number().min(0, '목표 마진율은 0 이상이어야 합니다').max(99.99, '목표 마진율은 100% 미만이어야 합니다')
  ),
}).refine(
  (data) => {
    // 할인율과 할인금액이 동시에 입력되지 않도록
    return !(data.discountRate > 0 && data.discountAmount > 0);
  },
  {
    message: '할인율과 할인 금액은 동시에 적용할 수 없습니다',
    path: ['discountRate'],
  }
).refine(
  (data) => {
    // 실제 판매가가 0보다 커야 함
    if (data.sellingPrice <= 0) return true; // 판매가 입력 전에는 통과
    const actualPrice = data.discountAmount > 0
      ? data.sellingPrice - data.discountAmount
      : data.discountRate > 0
        ? data.sellingPrice * (1 - data.discountRate / 100)
        : data.sellingPrice;
    return actualPrice > 0;
  },
  {
    message: '할인 적용 후 실제 판매가가 0보다 커야 합니다',
    path: ['discountAmount'],
  }
).refine(
  (data) => {
    // 총 수수료율이 비정상적으로 크면 경고
    const totalFeeRate = data.platformFeeRate + data.paymentFeeRate;
    return totalFeeRate <= 50;
  },
  {
    message: '총 수수료율이 50%를 초과합니다. 입력값을 확인해주세요',
    path: ['platformFeeRate'],
  }
);

export type CalculatorInputSchemaType = z.infer<typeof calculatorInputSchema>;

// 개별 필드 검증 함수들
export function validateSellingPrice(value: string): string | null {
  const num = parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) return null;
  if (num < 0) return '판매가는 0 이상이어야 합니다';
  return null;
}

export function validatePercentage(value: string, fieldName: string): string | null {
  const num = parseFloat(value.replace(/,/g, '').replace(/%/g, ''));
  if (isNaN(num)) return null;
  if (num < 0) return `${fieldName}은(는) 0 이상이어야 합니다`;
  if (num >= 100) return `${fieldName}은(는) 100% 미만이어야 합니다`;
  return null;
}

export function validatePositiveNumber(value: string, fieldName: string): string | null {
  const num = parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) return null;
  if (num < 0) return `${fieldName}은(는) 0 이상이어야 합니다`;
  return null;
}
