'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  Home,
  LayoutDashboard,
  Package,
  Store,
  Receipt,
  DollarSign,
  Wallet,
  BarChart3,
  Settings,
  Calculator,
  Upload,
} from 'lucide-react';

const navItems = [
  { href: '/', label: '계산기', icon: Calculator },
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/products', label: '상품 관리', icon: Package },
  { href: '/markets', label: '마켓 관리', icon: Store },
  { href: '/sales', label: '판매장부', icon: Receipt },
  { href: '/expenses', label: '광고비', icon: DollarSign },
  { href: '/expenses/operating', label: '운영비', icon: Wallet },
  { href: '/reports', label: '결산 리포트', icon: BarChart3 },
  { href: '/import', label: '데이터 가져오기', icon: Upload },
  { href: '/settings', label: '설정', icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="sm:hidden" />}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">메뉴 열기</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">마진 계산기</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
