'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NumberInput } from './inputs/NumberInput';
import {
  calculateMargin,
  calculateRecommendedPrice,
  calculateMaxAllowableCost,
  numberToInputString,
  parseNumericInput,
  formatCurrency,
  formatPercent,
  getMarginColorClass,
} from '@/lib/calculator';
import { PLATFORM_PRESETS, EXAMPLE_PRESETS } from '@/constants';
import { loadPlatformSettings } from '@/lib/storage';
import type { SalesChannel, VatType, CalculatorInputs, CalculationResult, ExamplePreset, PlatformPreset } from '@/types';
import { RotateCcw, Calculator, TrendingUp, TrendingDown, AlertCircle, ChevronRight, Target, DollarSign, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type CalculationMode = 'profit' | 'price' | 'cost';

export function MarginCalculator() {
  const [mode, setMode] = useState<CalculationMode>('profit');
  const [channel, setChannel] = useState<SalesChannel>('smartstore');
  const [subOptionId, setSubOptionId] = useState<string | null>(null);
  const [platformPresets, setPlatformPresets] = useState<Record<SalesChannel, PlatformPreset>>(PLATFORM_PRESETS);

  // 로컬스토리지에서 커스텀 설정 불러오기
  useEffect(() => {
    const loaded = loadPlatformSettings();
    setPlatformPresets(loaded);
    // 초기 수수료율도 업데이트
    const preset = loaded['smartstore'];
    if (preset) {
      setPlatformFeeRate(preset.platformFeeRate.toString());
      setPaymentFeeRate(preset.paymentFeeRate.toString());
    }
  }, []);

  // 핵심 입력값
  const [sellingPrice, setSellingPrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [platformFeeRate, setPlatformFeeRate] = useState('3.0');
  const [paymentFeeRate, setPaymentFeeRate] = useState('3.63');
  const [targetMarginRate, setTargetMarginRate] = useState('30');

  // 추가 비용
  const [sellerShippingCost, setSellerShippingCost] = useState('');
  const [packagingCost, setPackagingCost] = useState('');
  const [advertisingCost, setAdvertisingCost] = useState('');
  const [otherCosts, setOtherCosts] = useState('');

  // 고급 설정
  const [wholesaleVatType, setWholesaleVatType] = useState<VatType>('excluded');

  // 계산 결과
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null);
  const [maxAllowableCost, setMaxAllowableCost] = useState<number | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // 플랫폼 옵션 목록
  const platformOptions = useMemo(() => {
    return Object.values(platformPresets);
  }, [platformPresets]);

  // 현재 선택된 플랫폼의 하위 옵션들
  const currentSubOptions = useMemo(() => {
    return platformPresets[channel]?.subOptions || [];
  }, [platformPresets, channel]);

  // 현재 선택된 하위 옵션
  const selectedSubOption = useMemo(() => {
    if (!subOptionId) return null;
    return currentSubOptions.find(opt => opt.id === subOptionId) || null;
  }, [currentSubOptions, subOptionId]);

  // 채널 변경 시 수수료율 업데이트
  const handleChannelChange = useCallback((newChannel: SalesChannel) => {
    setChannel(newChannel);
    setSubOptionId(null);
    const preset = platformPresets[newChannel];
    if (preset) {
      setPlatformFeeRate(preset.platformFeeRate.toString());
      setPaymentFeeRate(preset.paymentFeeRate.toString());
    }
    setResult(null);
    setRecommendedPrice(null);
    setMaxAllowableCost(null);
    setHasCalculated(false);
  }, [platformPresets]);

  // 하위 옵션 변경 시 수수료율 업데이트
  const handleSubOptionChange = useCallback((optionId: string) => {
    setSubOptionId(optionId);
    const option = platformPresets[channel]?.subOptions?.find(opt => opt.id === optionId);
    if (option) {
      setPlatformFeeRate(option.platformFeeRate.toString());
      setPaymentFeeRate(option.paymentFeeRate.toString());
    }
    setResult(null);
    setRecommendedPrice(null);
    setMaxAllowableCost(null);
    setHasCalculated(false);
  }, [platformPresets, channel]);

  // 공통 입력값 생성
  const getInputs = useCallback((): CalculatorInputs => {
    const getInputValue = (id: string, fallback: string): string => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      return el?.value || fallback;
    };
    
    return {
      sellingPrice: parseNumericInput(getInputValue('sellingPrice', sellingPrice)),
      productCost: parseNumericInput(getInputValue('productCost', productCost)),
      discountRate: 0,
      discountAmount: 0,
      platformFeeRate: parseNumericInput(getInputValue('platformFeeRate', platformFeeRate)),
      paymentFeeRate: parseNumericInput(getInputValue('paymentFeeRate', paymentFeeRate)),
      couponBurden: 0,
      sellerShippingCost: parseNumericInput(getInputValue('sellerShippingCost', sellerShippingCost)),
      customerShippingCost: 0,
      packagingCost: parseNumericInput(getInputValue('packagingCost', packagingCost)),
      materialCost: 0,
      advertisingCost: parseNumericInput(getInputValue('advertisingCost', advertisingCost)),
      otherCosts: parseNumericInput(getInputValue('otherCosts', otherCosts)),
      sellingPriceVatIncluded: true,
      wholesaleVatType,
      targetMarginRate: parseNumericInput(getInputValue('targetMarginRate', targetMarginRate)),
    };
  }, [sellingPrice, productCost, platformFeeRate, paymentFeeRate, sellerShippingCost, packagingCost, advertisingCost, otherCosts, wholesaleVatType, targetMarginRate]);

  // 모드 1: 순이익 계산
  const handleCalculateProfit = useCallback(() => {
    const inputs = getInputs();
    
    if (inputs.sellingPrice <= 0) {
      alert('판매가를 입력해주세요');
      return;
    }

    try {
      const calcResult = calculateMargin(inputs);
      setResult(calcResult);
      setRecommendedPrice(null);
      setMaxAllowableCost(null);
      setHasCalculated(true);
    } catch (e) {
      alert('계산 중 오류가 발생했습니다');
    }
  }, [getInputs]);

  // 모드 2: 목표 마진율 → 판매가 정하기
  const handleCalculatePrice = useCallback(() => {
    const inputs = getInputs();
    
    if (inputs.productCost <= 0) {
      alert('상품 원가를 입력해주세요');
      return;
    }
    if (inputs.targetMarginRate <= 0 || inputs.targetMarginRate >= 100) {
      alert('목표 마진율을 1~99% 사이로 입력해주세요');
      return;
    }

    try {
      const price = calculateRecommendedPrice(inputs, inputs.targetMarginRate);
      
      if (price === Infinity || price <= 0) {
        alert('해당 조건으로는 목표 마진율 달성이 불가능합니다.\n수수료율을 낮추거나 목표 마진율을 조정해주세요.');
        return;
      }
      
      setRecommendedPrice(price);
      
      // 계산된 판매가로 순이익도 함께 계산
      const modifiedInputs = { ...inputs, sellingPrice: price };
      const calcResult = calculateMargin(modifiedInputs);
      setResult(calcResult);
      setMaxAllowableCost(null);
      setHasCalculated(true);
    } catch (e) {
      alert('계산 중 오류가 발생했습니다');
    }
  }, [getInputs]);

  // 모드 3: 원가 찾기 (최대 원가 계산)
  const handleCalculateCost = useCallback(() => {
    const inputs = getInputs();
    
    if (inputs.sellingPrice <= 0) {
      alert('판매가를 입력해주세요');
      return;
    }
    if (inputs.targetMarginRate <= 0 || inputs.targetMarginRate >= 100) {
      alert('목표 마진율을 1~99% 사이로 입력해주세요');
      return;
    }

    try {
      const maxCost = calculateMaxAllowableCost(inputs, inputs.targetMarginRate);
      
      if (maxCost <= 0) {
        alert('해당 조건으로는 목표 마진율 달성이 불가능합니다.\n판매가를 높이거나 수수료율을 낮춰주세요.');
        return;
      }
      
      setMaxAllowableCost(maxCost);
      
      // 계산된 원가로 순이익도 함께 계산
      const modifiedInputs = { ...inputs, productCost: maxCost };
      const calcResult = calculateMargin(modifiedInputs);
      setResult(calcResult);
      setRecommendedPrice(null);
      setHasCalculated(true);
    } catch (e) {
      alert('계산 중 오류가 발생했습니다');
    }
  }, [getInputs]);

  // 계산 실행 (모드에 따라)
  const handleCalculate = useCallback(() => {
    switch (mode) {
      case 'profit':
        handleCalculateProfit();
        break;
      case 'price':
        handleCalculatePrice();
        break;
      case 'cost':
        handleCalculateCost();
        break;
    }
  }, [mode, handleCalculateProfit, handleCalculatePrice, handleCalculateCost]);

  // 추가 비용 합계
  const additionalCostTotal = 
    parseNumericInput(sellerShippingCost) + 
    parseNumericInput(packagingCost) + 
    parseNumericInput(advertisingCost) + 
    parseNumericInput(otherCosts);

  // 초기화
  const handleReset = useCallback(() => {
    setSellingPrice('');
    setProductCost('');
    setTargetMarginRate('30');
    setSellerShippingCost('');
    setPackagingCost('');
    setAdvertisingCost('');
    setOtherCosts('');
    setWholesaleVatType('excluded');
    setResult(null);
    setRecommendedPrice(null);
    setMaxAllowableCost(null);
    setHasCalculated(false);
    setSubOptionId(null);
    const preset = platformPresets[channel];
    if (preset) {
      setPlatformFeeRate(preset.platformFeeRate.toString());
      setPaymentFeeRate(preset.paymentFeeRate.toString());
    }
  }, [platformPresets, channel]);

  // 예시값 적용
  const handleSelectExample = useCallback((preset: ExamplePreset) => {
    const v = preset.values;
    if (v.sellingPrice !== undefined) setSellingPrice(numberToInputString(v.sellingPrice));
    if (v.productCost !== undefined) setProductCost(numberToInputString(v.productCost));
    if (v.platformFeeRate !== undefined) setPlatformFeeRate(v.platformFeeRate.toString());
    if (v.paymentFeeRate !== undefined) setPaymentFeeRate(v.paymentFeeRate.toString());
    if (v.sellerShippingCost !== undefined) setSellerShippingCost(v.sellerShippingCost > 0 ? numberToInputString(v.sellerShippingCost) : '');
    if (v.packagingCost !== undefined) setPackagingCost(v.packagingCost > 0 ? numberToInputString(v.packagingCost) : '');
    if (v.advertisingCost !== undefined) setAdvertisingCost(v.advertisingCost > 0 ? numberToInputString(v.advertisingCost) : '');
    if (v.wholesaleVatType !== undefined) setWholesaleVatType(v.wholesaleVatType);
    setResult(null);
    setRecommendedPrice(null);
    setMaxAllowableCost(null);
    setHasCalculated(false);
  }, []);

  // 운영 판단 메시지
  const getJudgmentInfo = () => {
    if (!result) return null;
    const rate = result.marginRate;
    if (rate >= 40) return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', message: '안정적' };
    if (rate >= 25) return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', message: '양호' };
    if (rate >= 15) return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', message: '주의' };
    return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', message: '위험' };
  };

  const judgment = getJudgmentInfo();
  const totalFeeRate = parseNumericInput(platformFeeRate) + parseNumericInput(paymentFeeRate);

  // 모드별 버튼 텍스트
  const getButtonText = () => {
    switch (mode) {
      case 'profit': return '순이익 계산하기';
      case 'price': return '판매가 정하기';
      case 'cost': return '원가 찾기';
    }
  };

  // 모드별 안내 텍스트
  const getGuideText = () => {
    switch (mode) {
      case 'profit': return { line1: '판매가와 원가를 입력하고', line2: '순이익을 확인하세요' };
      case 'price': return { line1: '원가와 목표 마진율을 입력하고', line2: '필요한 판매가를 확인하세요' };
      case 'cost': return { line1: '판매가와 목표 마진율을 입력하고', line2: '맞출 수 있는 최대 원가를 확인하세요' };
    }
  };

  const guide = getGuideText();

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* 계산 모드 선택 */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={mode === 'profit' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('profit'); setHasCalculated(false); }}
          className="flex flex-col h-auto py-2 gap-0.5"
        >
          <DollarSign className="h-4 w-4" />
          <span className="text-xs">순이익 계산</span>
        </Button>
        <Button
          variant={mode === 'price' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('price'); setHasCalculated(false); }}
          className="flex flex-col h-auto py-2 gap-0.5"
        >
          <Target className="h-4 w-4" />
          <span className="text-xs">판매가 정하기</span>
        </Button>
        <Button
          variant={mode === 'cost' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('cost'); setHasCalculated(false); }}
          className="flex flex-col h-auto py-2 gap-0.5"
        >
          <Package className="h-4 w-4" />
          <span className="text-xs">원가 찾기</span>
        </Button>
      </div>

      {/* 채널 선택 & 예시 */}
      <div className="flex gap-2">
        <Select value={channel} onValueChange={(v) => handleChannelChange(v as SalesChannel)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="채널 선택">
              {platformPresets[channel]?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {platformOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => {
          const preset = EXAMPLE_PRESETS.find(p => p.id === v);
          if (preset) handleSelectExample(preset);
        }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="예시 불러오기" />
          </SelectTrigger>
          <SelectContent>
            {EXAMPLE_PRESETS.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Link href="/admin">
          <Button variant="ghost" size="icon" title="수수료 설정">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleReset} title="초기화">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* 하위 옵션 선택 (판매 방식/카테고리) */}
      {currentSubOptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
            <span>판매 방식 / 카테고리 선택</span>
          </div>
          {(() => {
            const tags = Array.from(new Set(currentSubOptions.map(o => o.tag).filter(Boolean)));
            const hasGroups = tags.length > 1;
            if (hasGroups) {
              return tags.map(tag => (
                <div key={tag} className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">{tag}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSubOptions.filter(o => o.tag === tag).map((option) => {
                      const totalRate = Math.round((option.platformFeeRate + option.paymentFeeRate) * 100) / 100;
                      return (
                        <Button
                          key={option.id}
                          variant={subOptionId === option.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleSubOptionChange(option.id)}
                          className="text-xs h-7"
                        >
                          {option.name}
                          <span className="ml-1 opacity-70">({totalRate}%)</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ));
            }
            return (
              <div className="flex flex-wrap gap-2">
                {currentSubOptions.map((option) => {
                  const totalRate = Math.round((option.platformFeeRate + option.paymentFeeRate) * 100) / 100;
                  return (
                    <Button
                      key={option.id}
                      variant={subOptionId === option.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSubOptionChange(option.id)}
                      className="text-xs"
                    >
                      {option.name}
                      <span className="ml-1 opacity-70">({totalRate}%)</span>
                    </Button>
                  );
                })}
              </div>
            );
          })()}
          {selectedSubOption?.description && (
            <p className="text-xs text-muted-foreground pl-5">
              {selectedSubOption.description}
            </p>
          )}
          {selectedSubOption?.logisticsCostNote && (
            <div className="ml-5 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
              <span className="font-medium">📦 물류비 참고:</span> {selectedSubOption.logisticsCostNote}
            </div>
          )}
          {selectedSubOption?.extraFees && selectedSubOption.extraFees.length > 0 && (
            <div className="ml-5 space-y-1">
              {selectedSubOption.extraFees.map((fee, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  <span className="font-medium">{fee.label}:</span> {fee.description}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 핵심 입력 */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          {/* 모드별 입력 필드 */}
          {mode === 'profit' && (
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                id="sellingPrice"
                label="판매가"
                value={sellingPrice}
                onChange={setSellingPrice}
                suffix="원"
                placeholder="10,000"
              />
              <NumberInput
                id="productCost"
                label="상품 원가"
                value={productCost}
                onChange={setProductCost}
                suffix="원"
                placeholder="4,000"
              />
            </div>
          )}

          {mode === 'price' && (
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                id="productCost"
                label="상품 원가"
                value={productCost}
                onChange={setProductCost}
                suffix="원"
                placeholder="4,000"
              />
              <NumberInput
                id="targetMarginRate"
                label="목표 마진율"
                value={targetMarginRate}
                onChange={setTargetMarginRate}
                suffix="%"
                placeholder="30"
                inputMode="decimal"
              />
            </div>
          )}

          {mode === 'cost' && (
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                id="sellingPrice"
                label="판매가"
                value={sellingPrice}
                onChange={setSellingPrice}
                suffix="원"
                placeholder="10,000"
              />
              <NumberInput
                id="targetMarginRate"
                label="목표 마진율"
                value={targetMarginRate}
                onChange={setTargetMarginRate}
                suffix="%"
                placeholder="30"
                inputMode="decimal"
              />
            </div>
          )}

          {/* 수수료 입력 */}
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              id="platformFeeRate"
              label="플랫폼 수수료"
              value={platformFeeRate}
              onChange={setPlatformFeeRate}
              suffix="%"
              inputMode="decimal"
            />
            <NumberInput
              id="paymentFeeRate"
              label="결제 수수료"
              value={paymentFeeRate}
              onChange={setPaymentFeeRate}
              suffix="%"
              inputMode="decimal"
            />
          </div>

          {/* 계산하기 버튼 */}
          <Button 
            onClick={handleCalculate} 
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            <Calculator className="h-5 w-5 mr-2" />
            {getButtonText()}
          </Button>
        </CardContent>
      </Card>

      {/* 결과 표시 */}
      {hasCalculated && result && (
        <Card className={cn('border-2', judgment?.bg, judgment?.border)}>
          <CardContent className="pt-5">
            {/* 모드별 핵심 결과 */}
            {mode === 'price' && recommendedPrice && (
              <div className="text-center mb-4 pb-4 border-b">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-muted-foreground">목표 마진율 {targetMarginRate}% 달성을 위한</span>
                </div>
                <p className="text-sm text-muted-foreground">권장 판매가</p>
                <p className="text-4xl font-bold text-blue-600">
                  {formatCurrency(recommendedPrice)}
                </p>
              </div>
            )}

            {mode === 'cost' && maxAllowableCost && (
              <div className="text-center mb-4 pb-4 border-b">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Package className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-muted-foreground">목표 마진율 {targetMarginRate}% 달성을 위한</span>
                </div>
                <p className="text-sm text-muted-foreground">맞출 수 있는 최대 원가</p>
                <p className="text-4xl font-bold text-purple-600">
                  {formatCurrency(maxAllowableCost)}
                </p>
              </div>
            )}

            {/* 순이익 결과 */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                {result.netProfit >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm text-muted-foreground">예상 순이익</span>
                <Badge variant={result.marginRate >= 25 ? 'default' : result.marginRate >= 15 ? 'secondary' : 'destructive'}>
                  {judgment?.message}
                </Badge>
              </div>
              <p className={cn('text-4xl font-bold', result.netProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
                {result.netProfit >= 0 ? '+' : ''}{formatCurrency(result.netProfit)}
              </p>
              <p className={cn('text-lg font-medium mt-1', getMarginColorClass(result.marginRate))}>
                마진율 {formatPercent(result.marginRate)}
              </p>
            </div>

            {/* 간단 내역 */}
            <div className="border-t pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">판매가</span>
                <span>{formatCurrency(result.actualSellingPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">원가</span>
                <span className="text-red-600">-{formatCurrency(result.productCostSupply)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">수수료 ({totalFeeRate}%)</span>
                <span className="text-red-600">-{formatCurrency(result.platformFee + result.paymentFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">부가세 (순)</span>
                <span className="text-red-600">-{formatCurrency(result.netVat)}</span>
              </div>
              {additionalCostTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">추가 비용</span>
                  <span className="text-red-600">-{formatCurrency(additionalCostTotal)}</span>
                </div>
              )}
            </div>

            {/* 추가 정보 */}
            {mode === 'profit' && result.breakEvenPrice > 0 && result.breakEvenPrice < Infinity && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>손익분기 판매가: <strong className="text-foreground">{formatCurrency(result.breakEvenPrice)}</strong></span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 입력 안내 (계산 전) */}
      {!hasCalculated && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-6 text-center text-muted-foreground">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{guide.line1}</p>
            <p className="text-sm font-medium">{guide.line2}</p>
          </CardContent>
        </Card>
      )}

      {/* 추가 비용 (접힘) */}
      <Accordion>
        <AccordionItem className="border rounded-lg">
          <AccordionTrigger className="px-4 text-sm">
            <div className="flex items-center gap-2">
              <span>추가 비용</span>
              {additionalCostTotal > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {formatCurrency(additionalCostTotal)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                id="sellerShippingCost"
                label="배송비 (판매자 부담)"
                value={sellerShippingCost}
                onChange={setSellerShippingCost}
                suffix="원"
                placeholder="0"
              />
              <NumberInput
                id="packagingCost"
                label="포장비"
                value={packagingCost}
                onChange={setPackagingCost}
                suffix="원"
                placeholder="0"
              />
              <NumberInput
                id="advertisingCost"
                label="광고비 (건당)"
                value={advertisingCost}
                onChange={setAdvertisingCost}
                suffix="원"
                placeholder="0"
              />
              <NumberInput
                id="otherCosts"
                label="기타 비용"
                value={otherCosts}
                onChange={setOtherCosts}
                suffix="원"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              추가 비용 입력 후 다시 계산하기를 눌러주세요
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 고급 설정 (접힘) */}
      <Accordion>
        <AccordionItem className="border rounded-lg">
          <AccordionTrigger className="px-4 text-sm text-muted-foreground">
            고급 설정
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">도매가 VAT 방식</label>
                <div className="flex gap-2">
                  <Button
                    variant={wholesaleVatType === 'excluded' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWholesaleVatType('excluded')}
                    className="flex-1"
                  >
                    VAT 별도
                  </Button>
                  <Button
                    variant={wholesaleVatType === 'included' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWholesaleVatType('included')}
                    className="flex-1"
                  >
                    VAT 포함
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  도매처 세금계산서 기준으로 선택
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 하단 안내 */}
      <p className="text-xs text-center text-muted-foreground">
        실제 정산 금액은 채널 정책에 따라 달라질 수 있습니다
      </p>
    </div>
  );
}
