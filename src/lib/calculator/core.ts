import type {
  CalculatorInputs,
  CalculationResult,
  CalculationVariables,
  OperationJudgment,
  OperationJudgmentLevel,
  VatType,
} from '@/types';
import { MARGIN_THRESHOLDS, OPERATION_MESSAGES } from '@/constants';

/**
 * 실제 판매가 계산 (할인 적용)
 * - 할인금액 입력 시: 판매가 - 할인금액
 * - 할인율 입력 시: 판매가 × (1 - 할인율/100)
 * - 할인 입력이 없으면: 판매가
 */
export function calculateActualSellingPrice(
  sellingPrice: number,
  discountRate: number,
  discountAmount: number
): number {
  if (discountAmount > 0) {
    return sellingPrice - discountAmount;
  }
  if (discountRate > 0) {
    return sellingPrice * (1 - discountRate / 100);
  }
  return sellingPrice;
}

/**
 * 매출 VAT 계산 (판매가 VAT 포함 기준)
 * - 공급가 = 판매가 / 1.1
 * - 매출VAT = 판매가 / 11
 */
export function calculateSalesVat(actualSellingPriceIncluded: number): {
  supplyPrice: number;
  vat: number;
} {
  const supplyPrice = actualSellingPriceIncluded / 1.1;
  const vat = actualSellingPriceIncluded / 11;
  return { supplyPrice, vat };
}

/**
 * 매입 VAT 계산
 * - VAT 별도: 매입가_공급가 = 원가, 매입VAT = 원가 × 0.1
 * - VAT 포함: 매입가_공급가 = 원가 / 1.1, 매입VAT = 원가 / 11
 */
export function calculatePurchaseVat(
  productCost: number,
  vatType: VatType
): {
  supplyPrice: number;
  vat: number;
  includedPrice: number;
} {
  if (vatType === 'excluded') {
    const supplyPrice = productCost;
    const vat = productCost * 0.1;
    const includedPrice = productCost + vat;
    return { supplyPrice, vat, includedPrice };
  } else {
    const includedPrice = productCost;
    const supplyPrice = productCost / 1.1;
    const vat = productCost / 11;
    return { supplyPrice, vat, includedPrice };
  }
}

/**
 * 수수료 계산 (VAT 포함 판매가 기준)
 */
export function calculateFees(
  actualSellingPriceIncluded: number,
  platformFeeRate: number,
  paymentFeeRate: number
): {
  platformFee: number;
  paymentFee: number;
  totalFee: number;
} {
  const platformFee = actualSellingPriceIncluded * (platformFeeRate / 100);
  const paymentFee = actualSellingPriceIncluded * (paymentFeeRate / 100);
  return {
    platformFee,
    paymentFee,
    totalFee: platformFee + paymentFee,
  };
}

/**
 * 운영 판단 결정
 */
export function determineOperationJudgment(marginRate: number): OperationJudgment {
  let level: OperationJudgmentLevel;

  if (marginRate >= MARGIN_THRESHOLDS.stable) {
    level = 'stable';
  } else if (marginRate >= MARGIN_THRESHOLDS.manageable) {
    level = 'manageable';
  } else if (marginRate >= MARGIN_THRESHOLDS.caution) {
    level = 'caution';
  } else {
    level = 'danger';
  }

  return {
    level,
    message: OPERATION_MESSAGES[level],
  };
}

/**
 * 손익분기 판매가 계산
 * 순이익 = 0이 되는 판매가를 역산
 */
export function calculateBreakEvenPrice(inputs: CalculatorInputs): number {
  const {
    productCost,
    platformFeeRate,
    paymentFeeRate,
    couponBurden,
    sellerShippingCost,
    customerShippingCost,
    packagingCost,
    materialCost,
    advertisingCost,
    otherCosts,
    wholesaleVatType,
  } = inputs;

  // 매입 VAT 계산
  const purchase = calculatePurchaseVat(productCost, wholesaleVatType);

  // 고정 비용 합계 (판매가와 무관한 비용)
  const fixedCosts =
    sellerShippingCost +
    packagingCost +
    materialCost +
    advertisingCost +
    otherCosts +
    couponBurden;

  // 총유입금액 = 실제판매가 + 고객부담배송비
  // 순이익 = 총유입금액 - 총비용 = 0
  // 실제판매가 + 고객부담배송비 = 매입가_공급가 + 순부가세 + 플랫폼수수료 + 결제수수료 + 고정비용

  // 순부가세 = 매출VAT - 매입VAT = (실제판매가/11) - 매입VAT
  // 플랫폼수수료 = 실제판매가 × (플랫폼수수료율/100)
  // 결제수수료 = 실제판매가 × (결제수수료율/100)

  // P + 고객배송비 = 매입가_공급가 + (P/11 - 매입VAT) + P×(플랫폼율+결제율)/100 + 고정비용
  // P - P/11 - P×(플랫폼율+결제율)/100 = 매입가_공급가 - 매입VAT + 고정비용 - 고객배송비
  // P × (1 - 1/11 - (플랫폼율+결제율)/100) = 매입가_공급가 - 매입VAT + 고정비용 - 고객배송비
  // P × (10/11 - (플랫폼율+결제율)/100) = 매입가_공급가 - 매입VAT + 고정비용 - 고객배송비

  const totalFeeRate = (platformFeeRate + paymentFeeRate) / 100;
  const coefficient = 10 / 11 - totalFeeRate;

  if (coefficient <= 0) {
    return Infinity;
  }

  const rightSide =
    purchase.supplyPrice - purchase.vat + fixedCosts - customerShippingCost;

  const breakEvenPrice = rightSide / coefficient;

  return Math.max(0, Math.ceil(breakEvenPrice));
}

/**
 * 목표 마진율 달성을 위한 권장 판매가 계산
 */
export function calculateRecommendedPrice(
  inputs: CalculatorInputs,
  targetMarginRate: number
): number {
  const {
    productCost,
    platformFeeRate,
    paymentFeeRate,
    couponBurden,
    sellerShippingCost,
    customerShippingCost,
    packagingCost,
    materialCost,
    advertisingCost,
    otherCosts,
    wholesaleVatType,
  } = inputs;

  // 매입 VAT 계산
  const purchase = calculatePurchaseVat(productCost, wholesaleVatType);

  // 고정 비용 합계
  const fixedCosts =
    sellerShippingCost +
    packagingCost +
    materialCost +
    advertisingCost +
    otherCosts +
    couponBurden;

  // 마진율 = 순이익 / 실제판매가 × 100 = targetMarginRate
  // 순이익 = 실제판매가 × (targetMarginRate/100)
  // 순이익 = 총유입금액 - 총비용
  // 실제판매가 × (targetMarginRate/100) = (실제판매가 + 고객배송비) - 총비용

  // 총비용 = 매입가_공급가 + 순부가세 + 플랫폼수수료 + 결제수수료 + 고정비용
  // 순부가세 = (P/11) - 매입VAT
  // 플랫폼수수료 = P × (플랫폼율/100)
  // 결제수수료 = P × (결제율/100)

  // P × (targetMarginRate/100) = P + 고객배송비 - 매입가_공급가 - (P/11 - 매입VAT) - P×(플랫폼율+결제율)/100 - 고정비용
  // P × (targetMarginRate/100) = P - P/11 - P×(플랫폼율+결제율)/100 + 고객배송비 - 매입가_공급가 + 매입VAT - 고정비용
  // P × (targetMarginRate/100 - 1 + 1/11 + (플랫폼율+결제율)/100) = 고객배송비 - 매입가_공급가 + 매입VAT - 고정비용
  // P × (targetMarginRate/100 - 10/11 + (플랫폼율+결제율)/100) = 고객배송비 - 매입가_공급가 + 매입VAT - 고정비용

  const totalFeeRate = (platformFeeRate + paymentFeeRate) / 100;
  const targetRate = targetMarginRate / 100;
  const coefficient = targetRate - 10 / 11 + totalFeeRate;

  // coefficient가 음수면 역산 가능
  // 양수면 불가능 (목표 마진이 너무 높음)
  if (coefficient >= 0) {
    return Infinity;
  }

  const rightSide =
    customerShippingCost - purchase.supplyPrice + purchase.vat - fixedCosts;

  const recommendedPrice = rightSide / coefficient;

  return Math.max(0, Math.ceil(recommendedPrice));
}

/**
 * 허용 가능한 최대 원가 계산
 */
export function calculateMaxAllowableCost(
  inputs: CalculatorInputs,
  targetMarginRate: number
): number {
  const {
    sellingPrice,
    discountRate,
    discountAmount,
    platformFeeRate,
    paymentFeeRate,
    couponBurden,
    sellerShippingCost,
    customerShippingCost,
    packagingCost,
    materialCost,
    advertisingCost,
    otherCosts,
    wholesaleVatType,
  } = inputs;

  // 실제 판매가 계산
  const actualSellingPrice = calculateActualSellingPrice(
    sellingPrice,
    discountRate,
    discountAmount
  );

  if (actualSellingPrice <= 0) {
    return 0;
  }

  // 목표 순이익
  const targetProfit = actualSellingPrice * (targetMarginRate / 100);

  // 총 유입금액
  const totalIncome = actualSellingPrice + customerShippingCost;

  // 수수료 계산
  const fees = calculateFees(actualSellingPrice, platformFeeRate, paymentFeeRate);

  // 고정 비용 (원가 제외)
  const fixedCostsWithoutCost =
    fees.platformFee +
    fees.paymentFee +
    sellerShippingCost +
    packagingCost +
    materialCost +
    advertisingCost +
    otherCosts +
    couponBurden;

  // 순이익 = 총유입금액 - 총비용
  // targetProfit = totalIncome - (매입가_공급가 + 순부가세 + 고정비용)
  // 순부가세 = 매출VAT - 매입VAT

  // 매출VAT 계산
  const salesVat = actualSellingPrice / 11;

  // VAT 별도인 경우:
  // 매입가_공급가 = C (원가)
  // 매입VAT = C × 0.1
  // 순부가세 = 매출VAT - C × 0.1
  // targetProfit = totalIncome - C - (매출VAT - C×0.1) - 고정비용
  // targetProfit = totalIncome - C - 매출VAT + C×0.1 - 고정비용
  // targetProfit = totalIncome - 0.9C - 매출VAT - 고정비용
  // 0.9C = totalIncome - 매출VAT - 고정비용 - targetProfit
  // C = (totalIncome - 매출VAT - 고정비용 - targetProfit) / 0.9

  // VAT 포함인 경우:
  // 매입가_공급가 = C / 1.1
  // 매입VAT = C / 11
  // 순부가세 = 매출VAT - C/11
  // targetProfit = totalIncome - C/1.1 - (매출VAT - C/11) - 고정비용
  // targetProfit = totalIncome - C/1.1 - 매출VAT + C/11 - 고정비용
  // C/1.1 - C/11 = 10C/11 - C/11 = 9C/11 = 0.818...C
  // targetProfit = totalIncome - (9C/11) - 매출VAT - 고정비용
  // 9C/11 = totalIncome - 매출VAT - 고정비용 - targetProfit
  // C = (totalIncome - 매출VAT - 고정비용 - targetProfit) × 11/9

  const availableForCost =
    totalIncome - salesVat - fixedCostsWithoutCost - targetProfit;

  let maxCost: number;

  if (wholesaleVatType === 'excluded') {
    maxCost = availableForCost / 0.9;
  } else {
    maxCost = (availableForCost * 11) / 9;
  }

  return Math.max(0, Math.floor(maxCost));
}

/**
 * 10% 할인 시 예상 순이익 계산 (재귀 방지를 위해 직접 계산)
 */
export function calculateProfitAfterDiscount(
  inputs: CalculatorInputs,
  discountPercent: number = 10
): number {
  const {
    sellingPrice,
    productCost,
    platformFeeRate,
    paymentFeeRate,
    couponBurden,
    sellerShippingCost,
    customerShippingCost,
    packagingCost,
    materialCost,
    advertisingCost,
    otherCosts,
    wholesaleVatType,
  } = inputs;

  // 할인 적용된 판매가
  const actualSellingPrice = sellingPrice * (1 - discountPercent / 100);
  
  // 총 유입 금액
  const totalIncome = actualSellingPrice + customerShippingCost;
  
  // 매출 VAT 계산
  const sales = calculateSalesVat(actualSellingPrice);
  
  // 매입 VAT 계산
  const purchase = calculatePurchaseVat(productCost, wholesaleVatType);
  
  // 순부가세
  const netVat = sales.vat - purchase.vat;
  
  // 수수료 계산
  const fees = calculateFees(actualSellingPrice, platformFeeRate, paymentFeeRate);
  
  // 총 비용 계산
  const totalCost =
    purchase.supplyPrice +
    netVat +
    fees.platformFee +
    fees.paymentFee +
    sellerShippingCost +
    packagingCost +
    materialCost +
    advertisingCost +
    otherCosts +
    couponBurden;
  
  // 순이익
  return totalIncome - totalCost;
}

/**
 * 메인 마진 계산 함수 (판매가 기준 모드)
 */
export function calculateMargin(inputs: CalculatorInputs): CalculationResult {
  const {
    sellingPrice,
    productCost,
    discountRate,
    discountAmount,
    platformFeeRate,
    paymentFeeRate,
    couponBurden,
    sellerShippingCost,
    customerShippingCost,
    packagingCost,
    materialCost,
    advertisingCost,
    otherCosts,
    wholesaleVatType,
  } = inputs;

  // 1. 실제 판매가 계산
  const actualSellingPrice = calculateActualSellingPrice(
    sellingPrice,
    discountRate,
    discountAmount
  );

  // 2. 총 유입 금액
  const totalIncome = actualSellingPrice + customerShippingCost;

  // 3. 매출 VAT 계산
  const sales = calculateSalesVat(actualSellingPrice);

  // 4. 매입 VAT 계산
  const purchase = calculatePurchaseVat(productCost, wholesaleVatType);

  // 5. 순부가세
  const netVat = sales.vat - purchase.vat;

  // 6. 수수료 계산
  const fees = calculateFees(actualSellingPrice, platformFeeRate, paymentFeeRate);

  // 7. 총 비용 계산
  const totalCost =
    purchase.supplyPrice +
    netVat +
    fees.platformFee +
    fees.paymentFee +
    sellerShippingCost +
    packagingCost +
    materialCost +
    advertisingCost +
    otherCosts +
    couponBurden;

  // 8. 순이익
  const netProfit = totalIncome - totalCost;

  // 9. 마진율 (실제 판매가 기준)
  const marginRate =
    actualSellingPrice > 0 ? (netProfit / actualSellingPrice) * 100 : 0;

  // 10. 운영 판단
  const operationJudgment = determineOperationJudgment(marginRate);

  // 11. 손익분기 판매가
  const breakEvenPrice = calculateBreakEvenPrice(inputs);

  // 12. 권장 판매가 (30% 마진 기준)
  const recommendedPrice = calculateRecommendedPrice(inputs, 30);

  // 13. 허용 가능한 최대 원가 (현재 마진율 유지 기준)
  const maxAllowableCost = calculateMaxAllowableCost(
    inputs,
    Math.max(marginRate, 0)
  );

  // 14. 10% 할인 시 예상 순이익
  const profitAfter10PercentDiscount = calculateProfitAfterDiscount(inputs, 10);

  return {
    netProfit: Math.round(netProfit),
    marginRate: Math.round(marginRate * 100) / 100,
    totalDeductions: Math.round(totalCost),
    actualSellingPrice: Math.round(actualSellingPrice),
    totalIncome: Math.round(totalIncome),
    productCostSupply: Math.round(purchase.supplyPrice),
    platformFee: Math.round(fees.platformFee),
    paymentFee: Math.round(fees.paymentFee),
    netVat: Math.round(netVat),
    shippingCost: Math.round(sellerShippingCost),
    packagingAndMaterialCost: Math.round(packagingCost + materialCost),
    advertisingCost: Math.round(advertisingCost),
    otherCosts: Math.round(otherCosts + couponBurden),
    salesVat: Math.round(sales.vat),
    purchaseVat: Math.round(purchase.vat),
    breakEvenPrice,
    recommendedPrice,
    maxAllowableCost,
    profitAfter10PercentDiscount: Math.round(profitAfter10PercentDiscount),
    operationJudgment,
  };
}

/**
 * 목표 마진 기준 모드 계산
 */
export function calculateByTargetMargin(
  inputs: CalculatorInputs
): CalculationResult & { targetRecommendedPrice: number } {
  const targetRecommendedPrice = calculateRecommendedPrice(
    inputs,
    inputs.targetMarginRate
  );

  // 권장 판매가로 다시 계산
  const modifiedInputs = {
    ...inputs,
    sellingPrice: targetRecommendedPrice,
    discountRate: 0,
    discountAmount: 0,
  };

  const result = calculateMargin(modifiedInputs);

  return {
    ...result,
    targetRecommendedPrice,
  };
}

/**
 * 허용 원가 기준 모드 계산
 */
export function calculateByMaxCost(
  inputs: CalculatorInputs
): CalculationResult & { calculatedMaxCost: number } {
  const calculatedMaxCost = calculateMaxAllowableCost(
    inputs,
    inputs.targetMarginRate
  );

  // 허용 원가로 다시 계산
  const modifiedInputs = {
    ...inputs,
    productCost: calculatedMaxCost,
  };

  const result = calculateMargin(modifiedInputs);

  return {
    ...result,
    calculatedMaxCost,
  };
}
