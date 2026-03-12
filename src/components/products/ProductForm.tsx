'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Product, ProductMarket } from '@/types/database';

const productSchema = z.object({
  name: z.string().min(1, '상품명을 입력하세요'),
  sku: z.string().optional(),
  base_cost: z.number().min(0, '원가는 0 이상이어야 합니다'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product & { product_markets?: ProductMarket[] };
  onSubmit: (data: ProductFormData & { markets?: any[] }) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      sku: initialData?.sku || '',
      base_cost: initialData?.base_cost || 0,
    },
  });

  const handleFormSubmit = async (data: ProductFormData) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">상품명 *</Label>
            <Input
              id="name"
              placeholder="예: 여성 니트 가디건"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU (관리코드)</Label>
            <Input
              id="sku"
              placeholder="예: KNT-001"
              {...register('sku')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_cost">기본 원가 (원)</Label>
            <Input
              id="base_cost"
              type="number"
              placeholder="0"
              {...register('base_cost', { valueAsNumber: true })}
            />
            {errors.base_cost && (
              <p className="text-sm text-red-500">{errors.base_cost.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData ? '저장' : '등록'}
        </Button>
      </div>
    </form>
  );
}
