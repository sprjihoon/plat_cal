'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';

export default function SignupPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다';
    }
    if (!/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      return '비밀번호는 영문과 숫자를 포함해야 합니다';
    }
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setError(null);

    // 유효성 검사
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!agreeTerms) {
      setError('이용약관에 동의해주세요');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Signup error:', error);
      if (error.message.includes('already registered')) {
        setError('이미 가입된 이메일입니다');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요');
      }
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'kakao' | 'naver') => {
    if (!supabase) return;
    
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider === 'naver' ? 'kakao' : provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Social signup error:', error);
      setError('소셜 회원가입에 실패했습니다');
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">이메일을 확인해주세요</CardTitle>
            <CardDescription>
              <span className="font-medium text-foreground">{email}</span>으로
              인증 메일을 보냈습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              메일함에서 인증 링크를 클릭하면 회원가입이 완료됩니다.
              메일이 도착하지 않았다면 스팸 폴더를 확인해주세요.
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                로그인 페이지로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>
            쇼핑몰 수익 관리 시스템에 가입하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 소셜 회원가입 */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-11 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] border-[#FEE500]"
              onClick={() => handleSocialSignup('kakao')}
              disabled={isLoading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.48 2 10.5c0 2.52 1.64 4.74 4.12 6.03-.18.66-.67 2.38-.77 2.75-.12.47.17.46.36.34.15-.1 2.37-1.57 3.32-2.2.64.09 1.3.14 1.97.14 5.52 0 10-3.48 10-7.5S17.52 3 12 3z"/>
              </svg>
              카카오
            </Button>

            <Button
              variant="outline"
              className="h-11 bg-[#03C75A] hover:bg-[#02B350] text-white border-[#03C75A]"
              onClick={() => handleSocialSignup('naver')}
              disabled={isLoading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
              </svg>
              네이버
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                또는 이메일로 가입
              </span>
            </div>
          </div>

          {/* 이메일 회원가입 폼 */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="8자 이상, 영문+숫자"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-500">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-tight cursor-pointer"
              >
                <Link href="/terms" className="text-primary hover:underline">이용약관</Link> 및{' '}
                <Link href="/privacy" className="text-primary hover:underline">개인정보처리방침</Link>에
                동의합니다
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              회원가입
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
