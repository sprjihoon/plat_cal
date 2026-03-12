'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PLATFORM_PRESETS } from '@/constants';
import { savePlatformSettings, loadPlatformSettings, resetPlatformSettings, getStoredUpdatedAt } from '@/lib/storage';
import type { PlatformPreset, SalesChannel, PlatformSubOption } from '@/types';
import { Save, RotateCcw, Plus, Trash2, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [platforms, setPlatforms] = useState<Record<SalesChannel, PlatformPreset>>(PLATFORM_PRESETS);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    const loaded = loadPlatformSettings();
    setPlatforms(loaded);
    setUpdatedAt(getStoredUpdatedAt());
  }, []);

  const handlePlatformFeeChange = useCallback((channelId: SalesChannel, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPlatforms(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        platformFeeRate: numValue,
      },
    }));
    setSaved(false);
  }, []);

  const handlePaymentFeeChange = useCallback((channelId: SalesChannel, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPlatforms(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        paymentFeeRate: numValue,
      },
    }));
    setSaved(false);
  }, []);

  const handleSubOptionChange = useCallback((
    channelId: SalesChannel,
    subOptionId: string,
    field: 'platformFeeRate' | 'paymentFeeRate' | 'name' | 'description',
    value: string
  ) => {
    setPlatforms(prev => {
      const platform = prev[channelId];
      if (!platform.subOptions) return prev;

      const updatedSubOptions = platform.subOptions.map(opt => {
        if (opt.id !== subOptionId) return opt;
        
        if (field === 'platformFeeRate' || field === 'paymentFeeRate') {
          return { ...opt, [field]: parseFloat(value) || 0 };
        }
        return { ...opt, [field]: value };
      });

      return {
        ...prev,
        [channelId]: {
          ...platform,
          subOptions: updatedSubOptions,
        },
      };
    });
    setSaved(false);
  }, []);

  const handleAddSubOption = useCallback((channelId: SalesChannel) => {
    setPlatforms(prev => {
      const platform = prev[channelId];
      const newId = `${channelId}_custom_${Date.now()}`;
      const newOption: PlatformSubOption = {
        id: newId,
        name: '새 옵션',
        description: '',
        platformFeeRate: platform.platformFeeRate,
        paymentFeeRate: platform.paymentFeeRate,
      };

      return {
        ...prev,
        [channelId]: {
          ...platform,
          subOptions: [...(platform.subOptions || []), newOption],
        },
      };
    });
    setSaved(false);
  }, []);

  const handleDeleteSubOption = useCallback((channelId: SalesChannel, subOptionId: string) => {
    setPlatforms(prev => {
      const platform = prev[channelId];
      if (!platform.subOptions) return prev;

      return {
        ...prev,
        [channelId]: {
          ...platform,
          subOptions: platform.subOptions.filter(opt => opt.id !== subOptionId),
        },
      };
    });
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    savePlatformSettings(platforms);
    setUpdatedAt(new Date().toISOString());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [platforms]);

  const handleReset = useCallback(() => {
    resetPlatformSettings();
    setPlatforms(PLATFORM_PRESETS);
    setUpdatedAt(null);
    setResetDialogOpen(false);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">플랫폼 수수료 설정</h1>
              <p className="text-sm text-muted-foreground">
                각 마켓별 수수료율을 설정합니다
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-1" />
                    초기화
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>설정 초기화</DialogTitle>
                  <DialogDescription>
                    모든 수수료 설정을 기본값으로 되돌립니다. 이 작업은 되돌릴 수 없습니다.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                    취소
                  </Button>
                  <Button variant="destructive" onClick={handleReset}>
                    초기화
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={handleSave} disabled={saved}>
              {saved ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  저장됨
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  저장
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 마지막 수정 시간 */}
        {updatedAt && (
          <p className="text-xs text-muted-foreground">
            마지막 저장: {formatDate(updatedAt)}
          </p>
        )}

        {/* 플랫폼 목록 */}
        <Accordion className="space-y-3">
          {Object.entries(platforms).map(([channelId, platform]) => {
            if (channelId === 'custom') return null;
            
            const totalRate = platform.platformFeeRate + platform.paymentFeeRate;
            
            return (
              <AccordionItem
                key={channelId}
                value={channelId}
                className="border rounded-lg bg-white"
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{platform.name}</span>
                    <Badge variant="secondary">
                      기본 {totalRate}%
                    </Badge>
                    {platform.subOptions && platform.subOptions.length > 0 && (
                      <Badge variant="outline">
                        {platform.subOptions.length}개 옵션
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {/* 기본 수수료 */}
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-3">기본 수수료율</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            플랫폼 수수료 (%)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={platform.platformFeeRate}
                            onChange={(e) => handlePlatformFeeChange(channelId as SalesChannel, e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            결제 수수료 (%)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={platform.paymentFeeRate}
                            onChange={(e) => handlePaymentFeeChange(channelId as SalesChannel, e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 서브 옵션 */}
                    {platform.subOptions && platform.subOptions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">판매 방식 / 카테고리별 수수료</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSubOption(channelId as SalesChannel)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            추가
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {platform.subOptions.map((option) => {
                            const optionTotal = option.platformFeeRate + option.paymentFeeRate;
                            return (
                              <div
                                key={option.id}
                                className="p-3 border rounded-lg space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={option.name}
                                      onChange={(e) => handleSubOptionChange(
                                        channelId as SalesChannel,
                                        option.id,
                                        'name',
                                        e.target.value
                                      )}
                                      className="h-8 w-40 font-medium"
                                    />
                                    <Badge variant="secondary" className="text-xs">
                                      {optionTotal}%
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteSubOption(channelId as SalesChannel, option.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <Input
                                  value={option.description || ''}
                                  onChange={(e) => handleSubOptionChange(
                                    channelId as SalesChannel,
                                    option.id,
                                    'description',
                                    e.target.value
                                  )}
                                  placeholder="설명 (선택)"
                                  className="h-8 text-sm text-muted-foreground"
                                />
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-muted-foreground">플랫폼 (%)</label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={option.platformFeeRate}
                                      onChange={(e) => handleSubOptionChange(
                                        channelId as SalesChannel,
                                        option.id,
                                        'platformFeeRate',
                                        e.target.value
                                      )}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground">결제 (%)</label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={option.paymentFeeRate}
                                      onChange={(e) => handleSubOptionChange(
                                        channelId as SalesChannel,
                                        option.id,
                                        'paymentFeeRate',
                                        e.target.value
                                      )}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 서브 옵션이 없는 경우 추가 버튼 */}
                    {(!platform.subOptions || platform.subOptions.length === 0) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSubOption(channelId as SalesChannel)}
                        className="w-full"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        세부 옵션 추가
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* 하단 안내 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-blue-800">
              <strong>안내:</strong> 설정한 수수료율은 브라우저에 저장되며, 마진 계산기에서 자동으로 적용됩니다.
              다른 기기에서는 별도로 설정해야 합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
