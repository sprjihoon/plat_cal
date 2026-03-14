'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { MobileNav } from './MobileNav';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  href: string;
  label: string;
}

interface HeaderProps {
  navItems?: NavItem[];
}

const defaultNavItems: NavItem[] = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/products', label: '상품' },
  { href: '/markets', label: '마켓' },
  { href: '/sales', label: '판매장부' },
  { href: '/expenses', label: '광고비' },
  { href: '/expenses/operating', label: '운영비' },
  { href: '/settlements', label: '정산' },
  { href: '/reports', label: '리포트' },
  { href: '/import', label: '가져오기' },
];

export function Header({ navItems = defaultNavItems }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MobileNav />
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            마진 계산기
          </Link>
          <nav className="hidden sm:flex items-center gap-0.5 ml-2">
            {navItems.map((item) => {
              const hasMoreSpecific = navItems.some(
                (other) => other.href !== item.href && other.href.startsWith(item.href + '/') && (pathname === other.href || pathname.startsWith(other.href + '/'))
              );
              const isActive = !hasMoreSpecific && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/')));
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-xl text-xs font-medium px-3 h-8 ${
                      isActive 
                        ? 'bg-primary/10 text-primary hover:bg-primary/15' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
