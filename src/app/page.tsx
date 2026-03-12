import { MarginCalculator } from '@/components/calculator';
import { UserMenu } from '@/components/auth/UserMenu';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50/50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">마진 계산기</Link>
          <UserMenu />
        </div>
      </header>

      {/* 메인 */}
      <div className="px-4 py-6">
        <MarginCalculator />
      </div>
    </main>
  );
}
