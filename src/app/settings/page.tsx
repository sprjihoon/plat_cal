'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, User, Lock, Shield, CheckCircle, Settings, Save, RotateCcw, Plus, Trash2, Check } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_PRESETS } from '@/constants';
import {
  savePlatformSettings,
  loadPlatformSettingsWithFallback,
  savePlatformSettingsToServer,
  resetPlatformSettingsOnServer,
  resetPlatformSettings,
} from '@/lib/storage';
import type { PlatformPreset, SalesChannel, PlatformSubOption } from '@/types';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  provider: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [defaultTab, setDefaultTab] = useState('profile');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'fees' || tab === 'security') setDefaultTab(tab);
  }, []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 비밀번호 변경
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // 계정 삭제
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 수수료 설정
  const [platforms, setPlatforms] = useState<Record<SalesChannel, PlatformPreset>>(PLATFORM_PRESETS);
  const [feeSaved, setFeeSaved] = useState(false);
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeLoading, setFeeLoading] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    loadPlatformSettingsWithFallback().then((loaded) => {
      setPlatforms(loaded);
      setFeeLoading(false);
    });
  }, []);

  const handlePlatformFeeChange = useCallback((channelId: SalesChannel, value: string) => {
    setPlatforms(prev => ({
      ...prev,
      [channelId]: { ...prev[channelId], platformFeeRate: parseFloat(value) || 0 },
    }));
    setFeeSaved(false);
  }, []);

  const handlePaymentFeeChange = useCallback((channelId: SalesChannel, value: string) => {
    setPlatforms(prev => ({
      ...prev,
      [channelId]: { ...prev[channelId], paymentFeeRate: parseFloat(value) || 0 },
    }));
    setFeeSaved(false);
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
      return { ...prev, [channelId]: { ...platform, subOptions: updatedSubOptions } };
    });
    setFeeSaved(false);
  }, []);

  const handleAddSubOption = useCallback((channelId: SalesChannel) => {
    setPlatforms(prev => {
      const platform = prev[channelId];
      const newOption: PlatformSubOption = {
        id: `${channelId}_custom_${Date.now()}`,
        name: '새 옵션',
        description: '',
        platformFeeRate: platform.platformFeeRate,
        paymentFeeRate: platform.paymentFeeRate,
      };
      return { ...prev, [channelId]: { ...platform, subOptions: [...(platform.subOptions || []), newOption] } };
    });
    setFeeSaved(false);
  }, []);

  const handleDeleteSubOption = useCallback((channelId: SalesChannel, subOptionId: string) => {
    setPlatforms(prev => {
      const platform = prev[channelId];
      if (!platform.subOptions) return prev;
      return { ...prev, [channelId]: { ...platform, subOptions: platform.subOptions.filter(opt => opt.id !== subOptionId) } };
    });
    setFeeSaved(false);
  }, []);

  const handleSaveFees = useCallback(async () => {
    setFeeSaving(true);
    savePlatformSettings(platforms);
    await savePlatformSettingsToServer(platforms);
    setFeeSaving(false);
    setFeeSaved(true);
    setTimeout(() => setFeeSaved(false), 2000);
  }, [platforms]);

  const handleResetFees = useCallback(async () => {
    resetPlatformSettings();
    await resetPlatformSettingsOnServer();
    setPlatforms(PLATFORM_PRESETS);
    setResetDialogOpen(false);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/login');
            return;
          }
          throw new Error('Failed to fetch');
        }
        const data = await res.json();
        setProfile(data);
        setName(data.name || '');
      } catch (err) {
        setError('프로필을 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setSuccess('프로필이 저장되었습니다');
    } catch (err) {
      setError('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다');
      return;
    }

    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('비밀번호는 영문과 숫자를 포함해야 합니다');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다');
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다');
    } finally {
      setChangingPassword(false);
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'kakao':
        return '카카오';
      case 'naver':
        return '네이버';
      case 'google':
        return 'Google';
      default:
        return '이메일';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">설정</h1>
            <p className="text-muted-foreground">계정 및 프로필 설정을 관리합니다</p>
          </div>
        </div>

        <Tabs key={defaultTab} defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              프로필
            </TabsTrigger>
            <TabsTrigger value="fees">
              <Settings className="h-4 w-4 mr-2" />
              수수료
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              보안
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>프로필 정보</CardTitle>
                <CardDescription>기본 프로필 정보를 수정합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      {getProviderName(profile?.provider || '')} 계정으로 로그인됨
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="이름을 입력하세요"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-[#D6F74C]/10 border border-[#D6F74C]/30 rounded-lg text-[#6b7a1a] text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {success}
                    </div>
                  )}

                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    저장
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">플랫폼 수수료 설정</h2>
                <p className="text-sm text-muted-foreground">각 마켓별 수수료율을 설정합니다</p>
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
                      <Button variant="outline" onClick={() => setResetDialogOpen(false)}>취소</Button>
                      <Button variant="destructive" onClick={handleResetFees}>초기화</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button onClick={handleSaveFees} disabled={feeSaved || feeSaving} size="sm">
                  {feeSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : feeSaved ? (
                    <><Check className="h-4 w-4 mr-1" />저장됨</>
                  ) : (
                    <><Save className="h-4 w-4 mr-1" />저장</>
                  )}
                </Button>
              </div>
            </div>

            {feeLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Accordion className="space-y-3">
                {Object.entries(platforms).map(([channelId, platform]) => {
                  if (channelId === 'custom') return null;
                  const totalRate = platform.platformFeeRate + platform.paymentFeeRate;

                  return (
                    <AccordionItem key={channelId} value={channelId} className="border rounded-lg bg-white">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{platform.name}</span>
                          <Badge variant="secondary">기본 {totalRate}%</Badge>
                          {platform.subOptions && platform.subOptions.length > 0 && (
                            <Badge variant="outline">{platform.subOptions.length}개 옵션</Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium mb-3">기본 수수료율</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">플랫폼 수수료 (%)</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={platform.platformFeeRate}
                                  onChange={(e) => handlePlatformFeeChange(channelId as SalesChannel, e.target.value)}
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">결제 수수료 (%)</label>
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

                          {platform.subOptions && platform.subOptions.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">판매 방식 / 카테고리별 수수료</p>
                                <Button variant="outline" size="sm" onClick={() => handleAddSubOption(channelId as SalesChannel)}>
                                  <Plus className="h-3.5 w-3.5 mr-1" />추가
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {(() => {
                                  const tags = Array.from(new Set(platform.subOptions!.map(o => o.tag).filter(Boolean)));
                                  const hasGroups = tags.length > 1;
                                  const renderOption = (option: PlatformSubOption) => {
                                    const optionTotal = option.platformFeeRate + option.paymentFeeRate;
                                    return (
                                      <div key={option.id} className="p-3 border rounded-lg space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Input
                                              value={option.name}
                                              onChange={(e) => handleSubOptionChange(channelId as SalesChannel, option.id, 'name', e.target.value)}
                                              className="h-8 w-40 font-medium"
                                            />
                                            <Badge variant="secondary" className="text-xs">{optionTotal}%</Badge>
                                            {option.tag && <Badge variant="outline" className="text-xs">{option.tag}</Badge>}
                                          </div>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSubOption(channelId as SalesChannel, option.id)}>
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <Input
                                          value={option.description || ''}
                                          onChange={(e) => handleSubOptionChange(channelId as SalesChannel, option.id, 'description', e.target.value)}
                                          placeholder="설명 (선택)"
                                          className="h-8 text-sm text-muted-foreground"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-xs text-muted-foreground">플랫폼 (%)</label>
                                            <Input type="number" step="0.01" value={option.platformFeeRate} onChange={(e) => handleSubOptionChange(channelId as SalesChannel, option.id, 'platformFeeRate', e.target.value)} className="h-8" />
                                          </div>
                                          <div>
                                            <label className="text-xs text-muted-foreground">결제 (%)</label>
                                            <Input type="number" step="0.01" value={option.paymentFeeRate} onChange={(e) => handleSubOptionChange(channelId as SalesChannel, option.id, 'paymentFeeRate', e.target.value)} className="h-8" />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  };

                                  if (hasGroups) {
                                    return tags.map(tag => (
                                      <div key={tag} className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">{tag}</p>
                                        {platform.subOptions!.filter(o => o.tag === tag).map(renderOption)}
                                      </div>
                                    ));
                                  }
                                  return platform.subOptions!.map(renderOption);
                                })()}
                              </div>
                            </div>
                          )}

                          {(!platform.subOptions || platform.subOptions.length === 0) && (
                            <Button variant="outline" size="sm" onClick={() => handleAddSubOption(channelId as SalesChannel)} className="w-full">
                              <Plus className="h-3.5 w-3.5 mr-1" />세부 옵션 추가
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <p className="text-sm text-blue-800">
                  <strong>안내:</strong> 설정한 수수료율은 계정에 저장되어 모든 기기에서 동일하게 적용됩니다.
                  초기화하면 기본 수수료율로 되돌아갑니다.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            {profile?.provider === 'email' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    비밀번호 변경
                  </CardTitle>
                  <CardDescription>계정 비밀번호를 변경합니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">새 비밀번호</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="8자 이상, 영문+숫자"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호 재입력"
                      />
                      {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-sm text-red-500">비밀번호가 일치하지 않습니다</p>
                      )}
                    </div>

                    {passwordError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="p-3 bg-[#D6F74C]/10 border border-[#D6F74C]/30 rounded-lg text-[#6b7a1a] text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        비밀번호가 변경되었습니다
                      </div>
                    )}

                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      비밀번호 변경
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    비밀번호
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {getProviderName(profile?.provider || '')} 소셜 로그인을 사용 중입니다.
                    비밀번호는 해당 서비스에서 관리됩니다.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">계정 삭제</CardTitle>
                <CardDescription>
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  계정 삭제
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 계정을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              계정을 삭제하면 모든 상품, 판매 기록, 비용 데이터가 영구적으로 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                try {
                  const res = await fetch('/api/profile', { method: 'DELETE' });
                  if (!res.ok) {
                    const data = await res.json();
                    alert(data.error || '계정 삭제에 실패했습니다');
                    return;
                  }
                  router.push('/auth/login');
                } catch {
                  alert('계정 삭제 중 오류가 발생했습니다');
                }
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
