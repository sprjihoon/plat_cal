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
  { href: '/products', label: '상품 관리' },
  { href: '/markets', label: '마켓 관리' },
  { href: '/sales', label: '판매장부' },
  { href: '/expenses', label: '광고비' },
  { href: '/expenses/operating', label: '운영비' },
  { href: '/settlements', label: '정산' },
  { href: '/reports', label: '결산 리포트' },
  { href: '/import', label: '데이터 가져오기' },
];

export function Header({ navItems = defaultNavItems }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MobileNav />
          <Link href="/" className="text-lg font-bold">
            마진 계산기
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isActive ? 'bg-gray-100' : ''}
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
