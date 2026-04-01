'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard, Package, Settings, Receipt, DollarSign, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';

export function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    const supabase = supabaseRef.current;

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!supabaseRef.current) return;
    setSigningOut(true);
    await supabaseRef.current.auth.signOut();
    window.location.href = '/';
  }, []);

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <User className="h-5 w-5" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Link href="/auth/login">
        <Button variant="outline" size="sm">
          로그인
        </Button>
      </Link>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const name = user.user_metadata?.name || user.email?.split('@')[0] || '사용자';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button {...props} variant="ghost" size="icon" className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <Link href="/dashboard">
          <DropdownMenuItem className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            대시보드
          </DropdownMenuItem>
        </Link>
        <Link href="/products">
          <DropdownMenuItem className="cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            상품 관리
          </DropdownMenuItem>
        </Link>
        <Link href="/sales">
          <DropdownMenuItem className="cursor-pointer">
            <Receipt className="mr-2 h-4 w-4" />
            판매장부
          </DropdownMenuItem>
        </Link>
        <Link href="/expenses">
          <DropdownMenuItem className="cursor-pointer">
            <DollarSign className="mr-2 h-4 w-4" />
            광고비
          </DropdownMenuItem>
        </Link>
        <Link href="/reports">
          <DropdownMenuItem className="cursor-pointer">
            <BarChart3 className="mr-2 h-4 w-4" />
            결산 리포트
          </DropdownMenuItem>
        </Link>
        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            설정
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600"
          disabled={signingOut}
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {signingOut ? '로그아웃 중...' : '로그아웃'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
