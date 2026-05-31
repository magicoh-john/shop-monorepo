'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import Link from 'next/link';
import { queryKeys } from '@/lib/queryKeys';
import ProductImage from './ProductImage';

interface Props {
  categorySlug?: string;
  keyword?: string;
}

export default function ProductGrid({ categorySlug, keyword }: Props) {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: queryKeys.products.infinite({ categorySlug }),
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams();
        if (categorySlug) params.set('category', categorySlug);
        if (keyword) params.set('keyword', keyword);
        if (pageParam) params.set('cursor', pageParam as string);
        const res = await fetch(`/api/products?${params}`);
        return res.json();
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const products = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-[calc(var(--radius)-2px)] border border-border overflow-hidden animate-pulse">
            <div className="aspect-square bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="rounded-[calc(var(--radius)-2px)] border border-border overflow-hidden hover:shadow-md transition-shadow bg-card"
          >
            <div className="aspect-square overflow-hidden">
              <ProductImage src={product.imageUrl} alt={product.name} />
            </div>
            <div className="p-3">
              {product.category && (
                <p className="text-xs text-muted-foreground">{product.category.name}</p>
              )}
              <p className="text-sm text-foreground font-medium mt-0.5 line-clamp-2">{product.name}</p>
              <p className="text-sm font-bold text-foreground mt-1">{product.price.toLocaleString()}원</p>
              <p className="text-xs text-muted-foreground mt-0.5">재고 {product.stock}개</p>
            </div>
          </Link>
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      <div ref={ref} className="h-10 flex items-center justify-center mt-4">
        {isFetchingNextPage && (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {!hasNextPage && products.length > 0 && (
          <p className="text-sm text-muted-foreground">모든 상품을 불러왔습니다.</p>
        )}
      </div>
    </>
  );
}
