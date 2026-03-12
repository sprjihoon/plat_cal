'use client';

import { useRouter } from 'next/navigation';
import { useCreateProduct } from '@/lib/hooks/useProducts';
import { ProductForm } from '@/components/products/ProductForm';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  const handleSubmit = async (data: any) => {
    await createProduct.mutateAsync({
      user_id: '', // API에서 처리
      ...data,
    });
    router.push('/products');
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold">마진 계산기</Link>
            <nav className="hidden sm:flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">대시보드</Button>
              </Link>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="bg-gray-100">상품 관리</Button>
              </Link>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">상품 등록</h1>
            <p className="text-muted-foreground">새 상품을 등록합니다</p>
          </div>
        </div>

        <ProductForm
          onSubmit={handleSubmit}
          isLoading={createProduct.isPending}
        />
      </main>
    </div>
  );
}
