'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, ProductInsert, ProductUpdate, ProductMarket } from '@/types/database';

interface ProductsResponse {
  products: (Product & { product_markets: ProductMarket[] })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProductWithMarkets extends Product {
  product_markets: ProductMarket[];
}

async function fetchProducts(page = 1, limit = 20, search = ''): Promise<ProductsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  
  const res = await fetch(`/api/products?${params}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

async function fetchProduct(id: string): Promise<ProductWithMarkets> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

async function createProduct(data: ProductInsert & { markets?: any[] }): Promise<ProductWithMarkets> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create product');
  }
  return res.json();
}

async function updateProduct(id: string, data: ProductUpdate & { markets?: any[] }): Promise<ProductWithMarkets> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update product');
  }
  return res.json();
}

async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete product');
  }
}

export function useProducts(page = 1, limit = 20, search = '') {
  return useQuery({
    queryKey: ['products', page, limit, search],
    queryFn: () => fetchProducts(page, limit, search),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate & { markets?: any[] } }) =>
      updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
