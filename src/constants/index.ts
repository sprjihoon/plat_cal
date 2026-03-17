export * from './platforms';
export * from './examples';

// 기본 입력값
export const DEFAULT_INPUTS = {
  sellingPrice: 0,
  productCost: 0,
  discountRate: 0,
  discountAmount: 0,
  platformFeeRate: 5.5,
  paymentFeeRate: 3.74,
  couponBurden: 0,
  sellerShippingCost: 0,
  customerShippingCost: 0,
  packagingCost: 0,
  materialCost: 0,
  advertisingCost: 0,
  otherCosts: 0,
  sellingPriceVatIncluded: true,
  wholesaleVatType: 'included' as const,
  targetMarginRate: 30,
};

// 마진율 기준 임계값
export const MARGIN_THRESHOLDS = {
  stable: 40,
  manageable: 25,
  caution: 15,
};

// 운영 판단 메시지
export const OPERATION_MESSAGES = {
  stable: '현재 가격 구조는 안정적인 편입니다',
  manageable: '운영은 가능하지만 할인 적용 시 마진이 빠르게 줄어들 수 있습니다',
  caution: '현재 마진이 낮습니다. 광고비나 할인 적용 시 적자 가능성이 있습니다',
  danger: '현재 조건에서는 수익성이 낮습니다. 판매가 인상 또는 원가 조정이 필요합니다',
};
