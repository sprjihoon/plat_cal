'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { NumberInput } from './inputs/NumberInput';
import {
  calculateMargin,
  calculateRecommendedPrice,
  calculateMaxAllowableCost,
  parseNumericInput,
  formatCurrency,
  formatPercent,
  getMarginColorClass,
} from '@/lib/calculator';
import { PLATFORM_PRESETS } from '@/constants';
import { loadPlatformSettings, loadPlatformSettingsWithFallback } from '@/lib/storage';
import type { SalesChannel, VatType, CalculatorInputs, CalculationResult, PlatformPreset } from '@/types';
import { RotateCcw, Calculator, TrendingUp, TrendingDown, AlertCircle, ChevronRight, Target, DollarSign, Package, Settings, Search, Plus, Loader2, CheckCircle, Lock, UserPlus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type CalculationMode = 'profit' | 'price' | 'cost';

export function MarginCalculator() {
  const [mode, setMode] = useState<CalculationMode>('profit');
  const [channel, setChannel] = useState<SalesChannel>('smartstore');
  const [subOptionId, setSubOptionId] = useState<string | null>(null);
  const [sourceOptionId, setSourceOptionId] = useState<string | null>(null);
  const [tierOptionId, setTierOptionId] = useState<string | null>(null);
  const [platformPresets, setPlatformPresets] = useState<Record<SalesChannel, PlatformPreset>>(PLATFORM_PRESETS);

  useEffect(() => {
    const localSettings = loadPlatformSettings();
    setPlatformPresets(localSettings);
    const preset = localSettings['smartstore'];
    if (preset) {
      setPlatformFeeRate(preset.platformFeeRate.toString());
      setPaymentFeeRate(preset.paymentFeeRate.toString());
    }

    loadPlatformSettingsWithFallback().then((serverSettings) => {
      setPlatformPresets(serverSettings);
      const sp = serverSettings['smartstore'];
      if (sp) {
        setPlatformFeeRate(sp.platformFeeRate.toString());
        setPaymentFeeRate(sp.paymentFeeRate.toString());
      }
    });
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

  // 도매가는 항상 VAT 포함
  const wholesaleVatType: VatType = 'included';

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

  const COMBO_TAGS: Record<string, { sourceTag: string; tierTag: string }> = {
    smartstore: { sourceTag: '유입경로', tierTag: '매출등급' },
  };

  const isComboChannel = channel in COMBO_TAGS;
  const comboConfig = COMBO_TAGS[channel];

  const sourceOptions = useMemo(() => {
    if (!isComboChannel || !comboConfig) return [];
    return currentSubOptions.filter(o => o.tag === comboConfig.sourceTag);
  }, [isComboChannel, comboConfig, currentSubOptions]);

  const tierOptions = useMemo(() => {
    if (!isComboChannel || !comboConfig) return [];
    return currentSubOptions.filter(o => o.tag === comboConfig.tierTag);
  }, [isComboChannel, comboConfig, currentSubOptions]);

  const otherGroupOptions = useMemo(() => {
    if (!isComboChannel || !comboConfig) return currentSubOptions;
    return currentSubOptions.filter(o => o.tag !== comboConfig.sourceTag && o.tag !== comboConfig.tierTag);
  }, [isComboChannel, comboConfig, currentSubOptions]);

  const selectedSourceOption = useMemo(() => {
    if (!sourceOptionId) return null;
    return sourceOptions.find(o => o.id === sourceOptionId) || null;
  }, [sourceOptions, sourceOptionId]);

  const selectedTierOption = useMemo(() => {
    if (!tierOptionId) return null;
    return tierOptions.find(o => o.id === tierOptionId) || null;
  }, [tierOptions, tierOptionId]);

  const applyComboFees = useCallback(() => {
    const sourceFee = selectedSourceOption?.platformFeeRate ?? platformPresets[channel]?.platformFeeRate ?? 0;
    const tierFee = selectedTierOption?.paymentFeeRate ?? platformPresets[channel]?.paymentFeeRate ?? 0;
    setPlatformFeeRate(sourceFee.toString());
    setPaymentFeeRate(tierFee.toString());
    setResult(null);
    setRecommendedPrice(null);
    setMaxAllowableCost(null);
    setHasCalculated(false);
  }, [selectedSourceOption, selectedTierOption, platformPresets, channel]);

  // 채널 변경 시 수수료율 업데이트
  const handleChannelChange = useCallback((newChannel: SalesChannel) => {
    setChannel(newChannel);
    setSubOptionId(null);
    setSourceOptionId(null);
    setTierOptionId(null);
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

  const handleSourceChange = useCallback((optionId: string) => {
    setSourceOptionId(optionId);
    setSubOptionId(null);
  }, []);

  const handleTierChange = useCallback((optionId: string) => {
    setTierOptionId(optionId);
    setSubOptionId(null);
  }, []);

  useEffect(() => {
    if (isComboChannel && (sourceOptionId || tierOptionId)) {
      applyComboFees();
    }
  }, [isComboChannel, sourceOptionId, tierOptionId, applyComboFees]);

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
  const handleCalculateProfit = useCallback((): boolean => {
    const inputs = getInputs();
    
    if (inputs.sellingPrice <= 0) {
      alert('판매가를 입력해주세요');
      return false;
    }

    try {
      const calcResult = calculateMargin(inputs);
      setResult(calcResult);
      setRecommendedPrice(null);
      setMaxAllowableCost(null);
      setHasCalculated(true);
      return true;
    } catch (e) {
      alert('계산 중 오류가 발생했습니다');
      return false;
    }
  }, [getInputs]);

  // 모드 2: 목표 마진율 → 판매가 정하기
  const handleCalculatePrice = useCallback((): boolean => {
    const inputs = getInputs();
    
    if (inputs.productCost <= 0) {
      alert('상품 원가를 입력해주세요');
      return false;
    }
    if (inputs.targetMarginRate <= 0 || inputs.targetMarginRate >= 100) {
      alert('목표 마진율을 1~99% 사이로 입력해주세요');
      return false;
    }

    try {
      const price = calculateRecommendedPrice(inputs, inputs.targetMarginRate);
      
      if (price === Infinity || price <= 0) {
        alert('해당 조건으로는 목표 마진율 달성이 불가능합니다.\n수수료율을 낮추거나 목표 마진율을 조정해주세요.');
        return false;
      }
      
      setRecommendedPrice(price);
      
      // 계산된 판매가로 순이익도 함께 계산
      const modifiedInputs = { ...inputs, sellingPrice: price };
      const calcResult = calculateMargin(modifiedInputs);
      setResult(calcResult);
      setMaxAllowableCost(null);
      setHasCalculated(true);
      return true;
    } catch (e) {
      alert('계산 중 오류가 발생했습니다');
      return false;
    }
  }, [getInputs]);

  // 모드 3: 원가 찾기 (최대 원가 계산)
  const handleCalculateCost = useCallback((): boolean => {
    const inputs = getInputs();
    
    if (inputs.sellingPrice <= 0) {
      alert('판매가를 입력해주세요');
      return false;
    }
    if (inputs.targetMarginRate <= 0 || inputs.targetMarginRate >= 100) {
      alert('목표 마진율을 1~99% 사이로 입력해주세요');
      return false;
    }

    try {
      const maxCost = calculateMaxAllowableCost(inputs, inputs.targetMarginRate);
      
      if (maxCost <= 0) {
        alert('해당 조건으로는 목표 마진율 달성이 불가능합니다.\n판매가를 높이거나 수수료율을 낮춰주세요.');
        return false;
      }
      
      setMaxAllowableCost(maxCost);
      
      // 계산된 원가로 순이익도 함께 계산
      const modifiedInputs = { ...inputs, productCost: maxCost };
      const calcResult = calculateMargin(modifiedInputs);
      setResult(calcResult);
      setRecommendedPrice(null);
      setHasCalculated(true);
      return true;
    } catch (e) {
      alert('계산 중 오류가 발생했습니다');
      return false;
    }
  }, [getInputs]);

  // 비회원 계산 횟수 제한
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [calcRemaining, setCalcRemaining] = useState<number | null>(null);
  const [calcLimit] = useState(5);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  useEffect(() => {
    fetch('/api/calculator/check')
      .then(r => r.json())
      .then(data => {
        setIsAuthenticated(data.isAuthenticated);
        if (!data.isAuthenticated) {
          setCalcRemaining(data.remaining);
        }
      })
      .catch(() => {});
  }, []);

  // 허용 여부만 확인 (카운트 증가 없음)
  const checkCalculationAllowed = useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) return true;
    try {
      const res = await fetch('/api/calculator/check');
      const data = await res.json();
      if (data.isAuthenticated) {
        setIsAuthenticated(true);
        return true;
      }
      setCalcRemaining(data.remaining);
      if (!data.allowed) {
        setShowSignupPrompt(true);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }, [isAuthenticated]);

  // 결과가 실제로 표시된 후 카운트 차감
  const recordCalculation = useCallback(async () => {
    if (isAuthenticated) return;
    try {
      const res = await fetch('/api/calculator/check', { method: 'POST' });
      const data = await res.json();
      if (!data.isAuthenticated) {
        setCalcRemaining(data.remaining);
      }
    } catch {}
  }, [isAuthenticated]);

  // 계산 실행 (모드에 따라)
  const handleCalculate = useCallback(async () => {
    const allowed = await checkCalculationAllowed();
    if (!allowed) return;

    let success = false;
    switch (mode) {
      case 'profit':
        success = handleCalculateProfit();
        break;
      case 'price':
        success = handleCalculatePrice();
        break;
      case 'cost':
        success = handleCalculateCost();
        break;
    }

    // 결과가 실제로 표시된 경우에만 횟수 차감
    if (success) {
      await recordCalculation();
    }
  }, [mode, handleCalculateProfit, handleCalculatePrice, handleCalculateCost, checkCalculationAllowed, recordCalculation]);

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
    setResult(null);
    setRecommendedPrice(null);
    setMaxAllowableCost(null);
    setHasCalculated(false);
    setSubOptionId(null);
    setSourceOptionId(null);
    setTierOptionId(null);
    const preset = platformPresets[channel];
    if (preset) {
      setPlatformFeeRate(preset.platformFeeRate.toString());
      setPaymentFeeRate(preset.paymentFeeRate.toString());
    }
  }, [platformPresets, channel]);

  // 상품 추가 다이얼로그
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productName, setProductName] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);
  const [addProductResult, setAddProductResult] = useState<'success' | 'error' | null>(null);

  const handleAddProduct = useCallback(async () => {
    if (!productName.trim() || !result) return;
    setAddingProduct(true);
    setAddProductResult(null);

    const actualSellingPrice = recommendedPrice || parseNumericInput(sellingPrice);
    const actualCost = maxAllowableCost || parseNumericInput(productCost);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productName.trim(),
          base_cost: actualCost,
          markets: [{
            channel,
            sub_option_id: subOptionId || (isComboChannel ? `${sourceOptionId || ''}_${tierOptionId || ''}` : null),
            selling_price: actualSellingPrice,
            platform_fee_rate: parseNumericInput(platformFeeRate),
            payment_fee_rate: parseNumericInput(paymentFeeRate),
            additional_costs: {
              shipping: parseNumericInput(sellerShippingCost),
              packaging: parseNumericInput(packagingCost),
              advertising: parseNumericInput(advertisingCost),
              other: parseNumericInput(otherCosts),
            },
          }],
        }),
      });

      if (res.ok) {
        setAddProductResult('success');
        setTimeout(() => {
          setShowAddProduct(false);
          setProductName('');
          setAddProductResult(null);
        }, 1500);
      } else {
        setAddProductResult('error');
      }
    } catch {
      setAddProductResult('error');
    } finally {
      setAddingProduct(false);
    }
  }, [productName, result, recommendedPrice, sellingPrice, maxAllowableCost, productCost, channel, subOptionId, isComboChannel, sourceOptionId, tierOptionId, platformFeeRate, paymentFeeRate, sellerShippingCost, packagingCost, advertisingCost, otherCosts]);

  // 운영 판단 메시지
  const getJudgmentInfo = () => {
    if (!result) return null;
    const rate = result.marginRate;
    if (rate >= 40) return { color: 'text-[#4a5abf]', bg: 'bg-card', border: 'border-border', message: '안정적' };
    if (rate >= 25) return { color: 'text-blue-600', bg: 'bg-card', border: 'border-border', message: '양호' };
    if (rate >= 15) return { color: 'text-yellow-600', bg: 'bg-card', border: 'border-border', message: '주의' };
    return { color: 'text-red-600', bg: 'bg-card', border: 'border-border', message: '위험' };
  };

  const judgment = getJudgmentInfo();
  const totalFeeRate = Number((parseNumericInput(platformFeeRate) + parseNumericInput(paymentFeeRate)).toFixed(2));

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

      {/* 채널 선택 */}
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
        <Link href="/settings?tab=fees">
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
            <span>{isComboChannel ? '유입경로 + 매출등급 선택' : '판매 방식 / 카테고리 선택'}</span>
          </div>

          {isComboChannel && comboConfig ? (
            <>
              {/* 유입경로 선택 → platformFeeRate 결정 */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                  {comboConfig.sourceTag} <span className="normal-case font-normal">(판매수수료)</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sourceOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant={sourceOptionId === option.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSourceChange(option.id)}
                      className="text-xs h-7"
                    >
                      {option.name}
                      <span className="ml-1 opacity-70">({option.platformFeeRate}%)</span>
                    </Button>
                  ))}
                </div>
                {selectedSourceOption?.description && (
                  <p className="text-xs text-muted-foreground pl-5">{selectedSourceOption.description}</p>
                )}
              </div>

              {/* 매출등급 선택 → paymentFeeRate 결정 */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                  {comboConfig.tierTag} <span className="normal-case font-normal">(결제수수료)</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tierOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant={tierOptionId === option.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTierChange(option.id)}
                      className="text-xs h-7"
                    >
                      {option.name}
                      <span className="ml-1 opacity-70">({option.paymentFeeRate}%)</span>
                    </Button>
                  ))}
                </div>
                {selectedTierOption?.description && (
                  <p className="text-xs text-muted-foreground pl-5">{selectedTierOption.description}</p>
                )}
              </div>

              {/* 조합 결과 표시 */}
              {(sourceOptionId || tierOptionId) && (
                <div className="ml-5 p-2.5 bg-[#8C9EFF]/10 border border-[#8C9EFF]/30 rounded-xl text-xs">
                  <span className="font-medium">적용 수수료:</span>{' '}
                  판매 {selectedSourceOption?.platformFeeRate ?? platformPresets[channel]?.platformFeeRate}% + 결제 {selectedTierOption?.paymentFeeRate ?? platformPresets[channel]?.paymentFeeRate}% ={' '}
                  <span className="font-bold">
                    합계 {((selectedSourceOption?.platformFeeRate ?? platformPresets[channel]?.platformFeeRate ?? 0) + (selectedTierOption?.paymentFeeRate ?? platformPresets[channel]?.paymentFeeRate ?? 0)).toFixed(2)}%
                  </span>
                </div>
              )}

              {/* 특수채널 (N배송관 등) */}
              {otherGroupOptions.length > 0 && (
                <div className="space-y-1.5">
                  {Array.from(new Set(otherGroupOptions.map(o => o.tag).filter(Boolean))).map(tag => (
                    <div key={tag} className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">{tag}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {otherGroupOptions.filter(o => o.tag === tag).map((option) => {
                          const totalRate = Math.round((option.platformFeeRate + option.paymentFeeRate) * 100) / 100;
                          return (
                            <Button
                              key={option.id}
                              variant={subOptionId === option.id ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSourceOptionId(null);
                                setTierOptionId(null);
                                handleSubOptionChange(option.id);
                              }}
                              className="text-xs h-7"
                            >
                              {option.name}
                              <span className="ml-1 opacity-70">({totalRate}%)</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
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
                  <span className="font-medium">물류비 참고:</span> {selectedSubOption.logisticsCostNote}
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
            </>
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
              <div>
                <NumberInput
                  id="productCost"
                  label="상품 원가 (VAT포함)"
                  value={productCost}
                  onChange={setProductCost}
                  suffix="원"
                  placeholder="4,000"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">도매가 VAT포함가 입력</p>
              </div>
            </div>
          )}

          {mode === 'price' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <NumberInput
                  id="productCost"
                  label="상품 원가 (VAT포함)"
                  value={productCost}
                  onChange={setProductCost}
                  suffix="원"
                  placeholder="4,000"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">도매가 VAT포함가 입력</p>
              </div>
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

        </CardContent>
      </Card>

      {/* 추가 비용 (접힘) */}
      <Accordion>
        <AccordionItem className="border rounded-lg">
          <AccordionTrigger className="px-4 text-sm">
            <div className="flex items-center gap-2">
              <span>추가 비용</span>
              <span className="text-[10px] text-muted-foreground font-normal">VAT포함가 입력</span>
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
                description="VAT포함가 입력"
              />
              <NumberInput
                id="packagingCost"
                label="포장비"
                value={packagingCost}
                onChange={setPackagingCost}
                suffix="원"
                placeholder="0"
                description="VAT포함가 입력"
              />
              <NumberInput
                id="advertisingCost"
                label="광고비 (건당)"
                value={advertisingCost}
                onChange={setAdvertisingCost}
                suffix="원"
                placeholder="0"
                description="VAT포함가 입력"
              />
              <NumberInput
                id="otherCosts"
                label="기타 비용"
                value={otherCosts}
                onChange={setOtherCosts}
                suffix="원"
                placeholder="0"
                description="VAT포함가 입력"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 비회원 사용 횟수 안내 */}
      {isAuthenticated === false && calcRemaining !== null && (
        <div className="flex items-center justify-between text-sm px-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            오늘 남은 무료 계산 횟수
          </span>
          <span className={cn(
            'font-semibold',
            calcRemaining <= 1 ? 'text-red-500' : calcRemaining <= 2 ? 'text-orange-500' : 'text-[#4a5abf]'
          )}>
            {calcRemaining} / {calcLimit}회
          </span>
        </div>
      )}

      {/* 계산하기 버튼 */}
      <Button 
        onClick={handleCalculate} 
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        <Calculator className="h-5 w-5 mr-2" />
        {getButtonText()}
      </Button>

      {/* 비회원 가입 유도 배너 */}
      {isAuthenticated === false && (
        <div className="flex items-center gap-3 rounded-lg border border-[#4a5abf]/30 bg-[#4a5abf]/5 px-4 py-3">
          <Sparkles className="h-4 w-4 text-[#4a5abf] shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">
            <Link href="/auth/signup" className="font-semibold text-[#4a5abf] hover:underline">무료 회원가입</Link>하면 횟수 제한 없이 마진계산기를 사용할 수 있어요
          </p>
        </div>
      )}

      {/* 결과 표시 */}
      {hasCalculated && result && (
        <Card className={cn('border-2', judgment?.bg, judgment?.border)}>
          <CardContent className="pt-5">
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

            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                {result.netProfit >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-[#4a5abf]" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm text-muted-foreground">예상 순이익</span>
                <Badge variant={result.marginRate >= 25 ? 'default' : result.marginRate >= 15 ? 'secondary' : 'destructive'}>
                  {judgment?.message}
                </Badge>
              </div>
              <p className={cn('text-4xl font-bold', result.netProfit >= 0 ? 'text-[#4a5abf]' : 'text-red-600')}>
                {result.netProfit >= 0 ? '+' : ''}{formatCurrency(result.netProfit)}
              </p>
              <p className={cn('text-lg font-medium mt-1', getMarginColorClass(result.marginRate))}>
                마진율 {formatPercent(result.marginRate)}
              </p>
            </div>

            <div className="border-t pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">판매가</span>
                <span>{formatCurrency(result.actualSellingPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">원가 (공급가)</span>
                <span className="text-red-600">-{formatCurrency(result.productCostSupply)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">수수료 ({totalFeeRate}%)</span>
                <span className="text-red-600">-{formatCurrency(result.platformFee + result.paymentFee)}</span>
              </div>
              {additionalCostTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">추가 비용</span>
                  <span className="text-red-600">-{formatCurrency(additionalCostTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">납부부가세</span>
                <span className={result.vatPayable >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {result.vatPayable >= 0 ? '-' : '+'}{formatCurrency(Math.abs(result.vatPayable))}
                </span>
              </div>
            </div>

            {/* 부가세 상세 */}
            <div className="mt-3 pt-3 border-t space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm mb-1.5">부가세 상세</p>
              <div className="flex justify-between">
                <span>매출부가세 (판매가의 1/11)</span>
                <span>{formatCurrency(result.salesVat)}</span>
              </div>
              <div className="flex justify-between">
                <span>매입부가세 (원가+수수료+비용의 VAT)</span>
                <span>-{formatCurrency(result.totalPurchaseVat)}</span>
              </div>
              <div className="flex justify-between font-medium text-foreground">
                <span>납부부가세</span>
                <span className={result.vatPayable >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(result.vatPayable)}
                </span>
              </div>
            </div>

            {mode === 'profit' && result.breakEvenPrice > 0 && result.breakEvenPrice < Infinity && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>손익분기 판매가: <strong className="text-foreground">{formatCurrency(result.breakEvenPrice)}</strong></span>
                </div>
              </div>
            )}

            {/* 상품으로 추가 버튼 */}
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setShowAddProduct(true); setAddProductResult(null); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                상품관리에 추가
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 상품 추가 다이얼로그 */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상품관리에 추가</DialogTitle>
            <DialogDescription>
              계산 결과를 상품으로 등록합니다. 채널({platformPresets[channel]?.name})과 수수료 설정이 함께 저장됩니다.
            </DialogDescription>
          </DialogHeader>

          {addProductResult === 'success' ? (
            <div className="py-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-[#4a5abf]" />
              <p className="font-medium text-lg">상품이 등록되었습니다</p>
              <p className="text-sm text-muted-foreground mt-1">상품관리에서 확인할 수 있습니다</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addProductName">상품명 *</Label>
                  <Input
                    id="addProductName"
                    placeholder="예: 니트 가디건"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && productName.trim()) handleAddProduct(); }}
                    autoFocus
                  />
                </div>

                <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">채널</span>
                    <span className="font-medium">{platformPresets[channel]?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">원가</span>
                    <span>{formatCurrency(maxAllowableCost || parseNumericInput(productCost))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">판매가</span>
                    <span>{formatCurrency(recommendedPrice || parseNumericInput(sellingPrice))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수수료</span>
                    <span>{platformFeeRate}% + {paymentFeeRate}%</span>
                  </div>
                  {result && (
                    <div className="flex justify-between pt-1.5 border-t font-medium">
                      <span>예상 순이익</span>
                      <span className={result.netProfit >= 0 ? 'text-[#4a5abf]' : 'text-red-600'}>
                        {formatCurrency(result.netProfit)} ({formatPercent(result.marginRate)})
                      </span>
                    </div>
                  )}
                </div>

                {addProductResult === 'error' && (
                  <p className="text-sm text-red-600">등록에 실패했습니다. 로그인 상태를 확인해주세요.</p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddProduct(false)}>취소</Button>
                <Button
                  onClick={handleAddProduct}
                  disabled={!productName.trim() || addingProduct}
                >
                  {addingProduct ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  등록
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 회원가입 유도 다이얼로그 (횟수 초과) */}
      <Dialog open={showSignupPrompt} onOpenChange={setShowSignupPrompt}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center justify-center mb-2">
              <div className="h-14 w-14 rounded-full bg-[#4a5abf]/10 flex items-center justify-center">
                <Lock className="h-7 w-7 text-[#4a5abf]" />
              </div>
            </div>
            <DialogTitle className="text-center">오늘 무료 사용 횟수를 모두 사용했어요</DialogTitle>
            <DialogDescription className="text-center">
              비회원은 하루 {calcLimit}회까지 무료로 계산할 수 있어요.<br />
              무료로 가입하면 횟수 제한 없이 사용할 수 있어요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#4a5abf]" />
                회원 무료 혜택
              </p>
              <ul className="space-y-1 text-muted-foreground pl-6 list-disc">
                <li>마진계산기 무제한 사용</li>
                <li>상품 관리 및 마진 추적</li>
                <li>판매 장부 & 수익 리포트</li>
                <li>시장조사 판별 도구</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Link href="/auth/signup" className="w-full">
              <Button className="w-full h-11 text-base font-semibold" onClick={() => setShowSignupPrompt(false)}>
                <UserPlus className="h-4 w-4 mr-2" />
                무료 회원가입
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full">
              <Button variant="outline" className="w-full" onClick={() => setShowSignupPrompt(false)}>
                이미 계정이 있어요 (로그인)
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* 시장조사 판별 바로가기 */}
      <Link href="/market-research">
        <Card className="border-dashed hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Search className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">시장조사 판별</p>
                <p className="text-xs text-muted-foreground">엑셀로 상품 목록을 올려 적합/부적합 판별</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* 하단 안내 */}
      <p className="text-xs text-center text-muted-foreground">
        실제 정산 금액은 채널 정책에 따라 달라질 수 있습니다
      </p>
    </div>
  );
}
