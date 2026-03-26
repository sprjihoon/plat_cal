'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export function FooterInfo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border/50">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-3 text-xs text-muted-foreground hover:text-foreground/70 transition-colors"
        >
          <span>&copy; {new Date().getFullYear()} 틸리언. All rights reserved.</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        <div
          className={`grid transition-all duration-200 ease-in-out ${open ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-semibold text-foreground/80">틸리언</span>
                <span>대표: 장지훈</span>
                <span>사업자등록번호: 766-55-00323</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>개인정보관리책임자: 장지훈</span>
                <span>연락처: 010-2723-9490</span>
                <a href="mailto:info@tillion.kr" className="hover:text-foreground transition-colors">문의: info@tillion.kr</a>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-border/50">
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  이용약관
                </Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  개인정보처리방침
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
