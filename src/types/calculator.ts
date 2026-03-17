// 판매 채널 타입
export type SalesChannel =
  | 'smartstore'
  | 'own_mall'
  | 'ably'
  | 'zigzag'
  | 'coupang'
  | 'open_market'
  | 'musinsa'
  | 'brandi'
  | 'wconcept'
  | '29cm'
  | 'custom';

// 계산 모드 타입
export type CalculationMode = 'price_based' | 'target_margin' | 'max_cost';

// VAT 방식 타입
export type VatType = 'included' | 'excluded';

// 입력값 인터페이스
export interface CalculatorInputs {
  // 기본 판매 정보
  sellingPrice: number;
  productCost: number;
  discountRate: number;
  discountAmount: number;

  // 수수료 정보
  platformFeeRate: number;
  paymentFeeRate: number;
  couponBurden: number;

  // 배송 및 포장 비용
  sellerShippingCost: number;
  customerShippingCost: number;
  packagingCost: number;
  materialCost: number;

  // 광고 및 기타 비용
  advertisingCost: number;
  otherCosts: number;

  // VAT 설정
  sellingPriceVatIncluded: boolean;
  wholesaleVatType: VatType;

  // 목표 마진 기준 모드용
  targetMarginRate: number;
}

// 계산 결과 인터페이스
export interface CalculationResult {
  // 핵심 결과
  netProfit: number;
  marginRate: number;
  totalDeductions: number;

  // 상세 계산 내역
  actualSellingPrice: number;
  totalIncome: number;
  productCostSupply: number;
  platformFee: number;
  paymentFee: number;
  netVat: number;
  shippingCost: number;
  packagingAndMaterialCost: number;
  advertisingCost: number;
  otherCosts: number;

  // 부가세 상세
  salesVat: number;
  purchaseVat: number;
  totalPurchaseVat: number;
  vatPayable: number;
  breakEvenPrice: number;
  recommendedPrice: number;
  maxAllowableCost: number;
  profitAfter10PercentDiscount: number;

  // 운영 판단
  operationJudgment: OperationJudgment;
}

// 운영 판단 타입
export type OperationJudgmentLevel = 'stable' | 'manageable' | 'caution' | 'danger';

export interface OperationJudgment {
  level: OperationJudgmentLevel;
  message: string;
}

// 플랫폼 하위 옵션 인터페이스
export interface PlatformSubOption {
  id: string;
  name: string;
  description?: string;
  platformFeeRate: number;
  paymentFeeRate: number;
  /** 판매 구조 태그 (로켓그로스, 마켓플레이스 등) */
  tag?: string;
  /** 물류비 참고 정보 (건당 예상 비용) */
  logisticsCostNote?: string;
  /** 추가 수수료 항목 (배송비 수수료, 서버이용료 등) */
  extraFees?: { label: string; description: string }[];
}

// 플랫폼 프리셋 인터페이스
export interface PlatformPreset {
  id: SalesChannel;
  name: string;
  platformFeeRate: number;
  paymentFeeRate: number;
  subOptions?: PlatformSubOption[];
}

// 예시값 프리셋 인터페이스
export interface ExamplePreset {
  id: string;
  name: string;
  description: string;
  values: Partial<CalculatorInputs>;
}

// 폼 스키마용 타입 (문자열 입력 처리)
export interface CalculatorFormInputs {
  sellingPrice: string;
  productCost: string;
  discountRate: string;
  discountAmount: string;
  platformFeeRate: string;
  paymentFeeRate: string;
  couponBurden: string;
  sellerShippingCost: string;
  customerShippingCost: string;
  packagingCost: string;
  materialCost: string;
  advertisingCost: string;
  otherCosts: string;
  sellingPriceVatIncluded: boolean;
  wholesaleVatType: VatType;
  targetMarginRate: string;
}

// 계산 중간 변수 인터페이스 (내부 계산용)
export interface CalculationVariables {
  sellingPriceIncluded: number;
  actualSellingPriceIncluded: number;
  sellingPriceSupply: number;
  salesVat: number;
  purchasePriceSupply: number;
  purchaseVat: number;
  netVat: number;
  platformFeeAmount: number;
  paymentFeeAmount: number;
  totalIncome: number;
  totalCost: number;
  netProfit: number;
  marginRate: number;
}
