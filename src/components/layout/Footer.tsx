import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-3 text-xs text-muted-foreground">
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
          <p className="text-muted-foreground/60 pt-1">
            &copy; {new Date().getFullYear()} 틸리언. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
