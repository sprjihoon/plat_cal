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
 * 공급가 = 판매가 / 1.1, 매출VAT = 판매가 / 11
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
 * 매입 VAT 계산 (항상 VAT 포함 기준)
 * 공급가 = 원가 / 1.1, 매입VAT = 원가 / 11
 */
export function calculatePurchaseVat(
  productCost: number,
  _vatType?: VatType
): {
  supplyPrice: number;
  vat: number;
  includedPrice: number;
} {
  const includedPrice = productCost;
  const supplyPrice = productCost / 1.1;
  const vat = productCost / 11;
  return { supplyPrice, vat, includedPrice };
}

/**
 * VAT 포함 금액에서 VAT 추출 (비용항목의 매입부가세 계산용)
 * 세금계산서 발행 비용(수수료, 광고비, 택배비, 포장비 등)의 VAT
 */
function extractVat(amountIncludingVat: number): number {
  return amountIncludingVat / 11;
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
 * 총 매입부가세 계산 (원가 + 비용항목들의 VAT 합산)
 * 세금계산서 발행 가능한 비용: 수수료, 광고비, 택배비, 포장비, 기타비용
 */
function calculateTotalPurchaseVat(
  productCostVat: number,
  fees: { platformFee: number; paymentFee: number },
  advertisingCost: number,
  sellerShippingCost: number,
  packagingCost: number,
  materialCost: number,
  otherCosts: number
): number {
  return (
    productCostVat +
    extractVat(fees.platformFee) +
    extractVat(fees.paymentFee) +
    extractVat(advertisingCost) +
    extractVat(sellerShippingCost) +
    extractVat(packagingCost) +
    extractVat(materialCost) +
    extractVat(otherCosts)
  );
}

/**
 * 손익분기 판매가 계산
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
  } = inputs;

  const purchase = calculatePurchaseVat(productCost);

  const fixedCosts =
    sellerShippingCost +
    packagingCost +
    materialCost +
    advertisingCost +
    otherCosts +
    couponBurden;

  // 매입부가세에 비용항목 VAT 포함하므로 순부가세 계산이 달라짐
  // 납부부가세 = 매출VAT - 총매입VAT
  // 총매입VAT = 원가VAT + 수수료VAT + 광고비VAT + 택배비VAT + 포장비VAT + 기타VAT
  // 수수료는 P에 비례하므로 수수료VAT도 P에 비례
  // 고정비용VAT = (택배비+포장비+광고비+기타)/11
  const fixedCostVat = (sellerShippingCost + packagingCost + materialCost + advertisingCost + otherCosts) / 11;

  const totalFeeRate = (platformFeeRate + paymentFeeRate) / 100;
  // 수수료VAT = P * totalFeeRate / 11
  // 납부부가세 = P/11 - purchase.vat - P*totalFeeRate/11 - fixedCostVat
  // = P*(1 - totalFeeRate)/11 - purchase.vat - fixedCostVat

  // 순이익 = P + 고객배송비 - purchase.supplyPrice - 납부부가세 - 수수료 - 고정비용
  // 0 = P + 고객배송비 - purchase.supplyPrice - [P*(1-totalFeeRate)/11 - purchase.vat - fixedCostVat] - P*totalFeeRate - 고정비용
  // 0 = P(1 - (1-totalFeeRate)/11 - totalFeeRate) + 고객배송비 - purchase.supplyPrice + purchase.vat + fixedCostVat - 고정비용

  const coefficient = 1 - (1 - totalFeeRate) / 11 - totalFeeRate;

  if (coefficient <= 0) {
    return Infinity;
  }

  const rightSide =
    purchase.supplyPrice - purchase.vat - fixedCostVat + fixedCosts - customerShippingCost;

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
  } = inputs;

  const purchase = calculatePurchaseVat(productCost);

  const fixedCosts =
    sellerShippingCost +
    packagingCost +
    materialCost +
    advertisingCost +
    otherCosts +
    couponBurden;

  const fixedCostVat = (sellerShippingCost + packagingCost + materialCost + advertisingCost + otherCosts) / 11;

  const totalFeeRate = (platformFeeRate + paymentFeeRate) / 100;
  const targetRate = targetMarginRate / 100;

  // P * targetRate = P + 고객배송비 - purchase.supplyPrice - 납부부가세 - 수수료 - 고정비용
  // 납부부가세 = P*(1-totalFeeRate)/11 - purchase.vat - fixedCostVat
  // P * targetRate = P(1 - (1-totalFeeRate)/11 - totalFeeRate) + 고객배송비 - purchase.supplyPrice + purchase.vat + fixedCostVat - 고정비용
  // P * (targetRate - 1 + (1-totalFeeRate)/11 + totalFeeRate) = 고객배송비 - purchase.supplyPrice + purchase.vat + fixedCostVat - 고정비용

  const coefficient = targetRate - 1 + (1 - totalFeeRate) / 11 + totalFeeRate;

  if (coefficient >= 0) {
    return Infinity;
  }

  const rightSide =
    customerShippingCost - purchase.supplyPrice + purchase.vat + fixedCostVat - fixedCosts;

  const recommendedPrice = rightSide / coefficient;

  return Math.max(0, Math.ceil(recommendedPrice));
}

/**
 * 맞출 수 있는 최대 원가 계산 (원가 찾기)
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
  } = inputs;

  const actualSellingPrice = calculateActualSellingPrice(
    sellingPrice,
    discountRate,
    discountAmount
  );

  if (actualSellingPrice <= 0) {
    return 0;
  }

  const targetProfit = actualSellingPrice * (targetMarginRate / 100);
  const totalIncome = actualSellingPrice + customerShippingCost;
  const fees = calculateFees(actualSellingPrice, platformFeeRate, paymentFeeRate);

  const fixedCostsWithoutCost =
    fees.platformFee +
    fees.paymentFee +
    sellerShippingCost +
    packagingCost +
    materialCost +
    advertisingCost +
    otherCosts +
    couponBurden;

  const salesVat = actualSellingPrice / 11;
  const feeVat = (fees.platformFee + fees.paymentFee) / 11;
  const costVat = (sellerShippingCost + packagingCost + materialCost + advertisingCost + otherCosts) / 11;

  // 도매가 VAT 포함 고정:
  // 원가공급가 = C / 1.1, 원가VAT = C / 11
  // 총매입VAT = C/11 + feeVat + costVat
  // 납부부가세 = salesVat - C/11 - feeVat - costVat
  // 순이익 = totalIncome - C/1.1 - 납부부가세 - 수수료 - 고정비용(원가제외)
  //        = totalIncome - C/1.1 - salesVat + C/11 + feeVat + costVat - fixedCostsWithoutCost
  // targetProfit = totalIncome - 9C/11 - salesVat + feeVat + costVat - fixedCostsWithoutCost
  // 9C/11 = totalIncome - salesVat + feeVat + costVat - fixedCostsWithoutCost - targetProfit
  // C = (totalIncome - salesVat + feeVat + costVat - fixedCostsWithoutCost - targetProfit) * 11/9

  const availableForCost =
    totalIncome - salesVat + feeVat + costVat - fixedCostsWithoutCost - targetProfit;

  const maxCost = (availableForCost * 11) / 9;

  return Math.max(0, Math.floor(maxCost));
}

/**
 * 10% 할인 시 예상 순이익 계산
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
  } = inputs;

  const actualSellingPrice = sellingPrice * (1 - discountPercent / 100);
  const totalIncome = actualSellingPrice + customerShippingCost;
  const sales = calculateSalesVat(actualSellingPrice);
  const purchase = calculatePurchaseVat(productCost);
  const fees = calculateFees(actualSellingPrice, platformFeeRate, paymentFeeRate);

  const totalPurchaseVat = calculateTotalPurchaseVat(
    purchase.vat, fees, advertisingCost, sellerShippingCost, packagingCost, materialCost, otherCosts
  );
  const vatPayable = sales.vat - totalPurchaseVat;

  const totalCost =
    purchase.supplyPrice +
    vatPayable +
    fees.platformFee +
    fees.paymentFee +
    sellerShippingCost +
    packagingCost +
    materialCost +
    advertisingCost +
    otherCosts +
    couponBurden;

  return totalIncome - totalCost;
}

/**
 * 메인 마진 계산 함수
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
  } = inputs;

  const actualSellingPrice = calculateActualSellingPrice(
    sellingPrice,
    discountRate,
    discountAmount
  );

  const totalIncome = actualSellingPrice + customerShippingCost;
  const sales = calculateSalesVat(actualSellingPrice);
  const purchase = calculatePurchaseVat(productCost);
  const fees = calculateFees(actualSellingPrice, platformFeeRate, paymentFeeRate);

  // 총 매입부가세 = 원가VAT + 수수료VAT + 광고비VAT + 택배비VAT + 포장비VAT + 기타VAT
  const totalPurchaseVat = calculateTotalPurchaseVat(
    purchase.vat, fees, advertisingCost, sellerShippingCost, packagingCost, materialCost, otherCosts
  );

  // 납부부가세 = 매출부가세 - 총매입부가세
  const vatPayable = sales.vat - totalPurchaseVat;

  // 총 비용 (납부부가세 사용)
  const totalCost =
    purchase.supplyPrice +
    vatPayable +
    fees.platformFee +
    fees.paymentFee +
    sellerShippingCost +
    packagingCost +
    materialCost +
    advertisingCost +
    otherCosts +
    couponBurden;

  const netProfit = totalIncome - totalCost;

  const marginRate =
    actualSellingPrice > 0 ? (netProfit / actualSellingPrice) * 100 : 0;

  const operationJudgment = determineOperationJudgment(marginRate);
  const breakEvenPrice = calculateBreakEvenPrice(inputs);
  const recommendedPrice = calculateRecommendedPrice(inputs, 30);
  const maxAllowableCost = calculateMaxAllowableCost(
    inputs,
    Math.max(marginRate, 0)
  );
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
    netVat: Math.round(vatPayable),
    shippingCost: Math.round(sellerShippingCost),
    packagingAndMaterialCost: Math.round(packagingCost + materialCost),
    advertisingCost: Math.round(advertisingCost),
    otherCosts: Math.round(otherCosts + couponBurden),
    salesVat: Math.round(sales.vat),
    purchaseVat: Math.round(purchase.vat),
    totalPurchaseVat: Math.round(totalPurchaseVat),
    vatPayable: Math.round(vatPayable),
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
 * 원가 찾기 모드 계산
 */
export function calculateByMaxCost(
  inputs: CalculatorInputs
): CalculationResult & { calculatedMaxCost: number } {
  const calculatedMaxCost = calculateMaxAllowableCost(
    inputs,
    inputs.targetMarginRate
  );

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
