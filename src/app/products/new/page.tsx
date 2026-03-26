'use client';

import { useRouter } from 'next/navigation';
import { useCreateProduct } from '@/lib/hooks/useProducts';
import { ProductForm } from '@/components/products/ProductForm';
import { Header } from '@/components/layout/Header';
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
    <div className="bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-3 py-4 space-y-4 sm:px-4 sm:py-6 sm:space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">상품 등록</h1>
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
