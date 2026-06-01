# 스펙 02 — 상품 목록 & 상품 상세

## 목표
상품 목록을 무한 스크롤로 보여주고, 상품 상세 페이지를 구현한다.
TanStack Query를 처음으로 실제 적용하는 스펙이다.

## 완료 기준
- `/products` 페이지에서 상품 목록이 그리드로 표시된다
- 스크롤을 내리면 다음 상품이 자동으로 로드된다 (무한 스크롤)
- 카테고리 버튼 클릭 시 해당 카테고리 상품만 표시된다
- `/products/[id]` 페이지가 좌(이미지) / 우(정보+액션) 2단 레이아웃으로 표시된다
- 우측에 수량 조절(+/−), [주문하기], [장바구니 담기], [찜하기] 버튼이 있다
  - 버튼 동작은 스펙 03(장바구니), 스펙 08(찜하기)에서 구현
- 하단에 리뷰 섹션이 있다 (내용은 스펙 09에서 구현, 현재는 플레이스홀더)
- 하단에 상품 상세정보 섹션이 있다 (product.description 표시)

---

## DB 스키마 변경

없음. 기존 `Product` 모델 사용.

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/app/api/products/route.ts` | 수정 — 페이지네이션, 카테고리 필터 쿼리 구현 |
| `src/lib/queryKeys.ts` | 생성 — Query Key 중앙 관리 |
| `src/features/products/components/ProductCard.tsx` | 생성 |
| `src/features/products/components/ProductGrid.tsx` | 생성 — 무한 스크롤 |
| `src/features/products/components/CategoryFilter.tsx` | 생성 |
| `src/app/(shop)/products/page.tsx` | 수정 |
| `src/app/(shop)/products/[id]/page.tsx` | 수정 |

---

## 구현 순서

### 1. queryKeys.ts 생성

```ts
// src/lib/queryKeys.ts
export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params: { category?: string; cursor?: string }) =>
      ['products', 'list', params] as const,
    detail: (id: string) => ['products', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    byUser: (userId: string) => ['orders', userId] as const,
  },
  reviews: {
    byProduct: (productId: string) => ['reviews', productId] as const,
  },
} as const;
```

### 2. API Route 수정 — 커서 기반 페이지네이션

```ts
// src/app/api/products/route.ts
import { prisma } from '@my-project/database';
import { NextRequest } from 'next/server';

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category') ?? undefined;
  const cursor = searchParams.get('cursor') ?? undefined;

  const products = await prisma.product.findMany({
    take: PAGE_SIZE + 1,             // 다음 페이지 존재 여부 확인용 +1
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    where: { ...(category && { category }) },
    orderBy: { createdAt: 'desc' },
  });

  const hasNextPage = products.length > PAGE_SIZE;
  const items = hasNextPage ? products.slice(0, PAGE_SIZE) : products;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return Response.json({ items, nextCursor });
}
```

### 3. ProductCard.tsx 생성

```tsx
// src/features/products/components/ProductCard.tsx
import type { Product } from '@my-project/types';
import Link from 'next/link';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square bg-muted flex items-center justify-center">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            : <span className="text-muted-foreground text-sm">이미지 없음</span>
          }
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{product.category}</p>
          <h3 className="font-medium text-foreground mt-1">{product.name}</h3>
          <p className="text-foreground font-semibold mt-2">{product.price.toLocaleString()}원</p>
          <p className="text-xs text-muted-foreground mt-1">재고 {product.stock}개</p>
        </div>
      </div>
    </Link>
  );
}
```

### 4. ProductGrid.tsx — 무한 스크롤

```tsx
// src/features/products/components/ProductGrid.tsx
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import ProductCard from './ProductCard';

export default function ProductGrid({ category }: { category?: string }) {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.products.list({ category }),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
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

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div ref={ref} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && <p className="text-sm text-muted-foreground">로딩 중...</p>}
      </div>
    </>
  );
}
```

### 5. /products/page.tsx 수정

```tsx
// src/app/(shop)/products/page.tsx
import ProductGrid from '@/features/products/components/ProductGrid';
import CategoryFilter from '@/features/products/components/CategoryFilter';

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-6">상품</h1>
      <CategoryFilter selected={searchParams.category} />
      <ProductGrid category={searchParams.category} />
    </div>
  );
}
```

### 6. CategoryFilter.tsx 생성

```tsx
// src/features/products/components/CategoryFilter.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = ['전체', '상의', '하의', '신발', '액세서리'];

export default function CategoryFilter({ selected }: { selected?: string }) {
  const router = useRouter();

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {CATEGORIES.map((cat) => {
        const isSelected = cat === '전체' ? !selected : selected === cat;
        return (
          <button
            key={cat}
            onClick={() => router.push(cat === '전체' ? '/products' : `/products?category=${cat}`)}
            className={`px-4 py-1.5 rounded-[calc(var(--radius)-2px)] text-sm border transition-colors ${
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:bg-accent'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
```

---

## 패키지 설치

```bash
# apps/web 디렉토리에서 실행
pnpm add react-intersection-observer
```
