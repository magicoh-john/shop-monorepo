# 스펙 07 — 키워드 검색

## 목표
상품명과 설명을 기준으로 키워드 검색을 구현한다.

## 완료 기준
- Header의 검색창에 키워드 입력 후 엔터 시 `/search?q=키워드`로 이동한다
- `/search` 페이지에서 검색 결과가 상품 그리드로 표시된다
- 결과가 없으면 "검색 결과가 없습니다" 메시지가 표시된다
- TanStack Query로 검색 결과를 캐싱한다

---

## DB 스키마 변경

없음. Prisma `contains` 필터 사용.

---

## 사전 구현 현황

| 항목 | 상태 |
|---|---|
| `src/app/api/products/route.ts` | ✅ 이미 `keyword` 쿼리 파라미터 지원 |
| `src/components/layout/SearchBar.tsx` | ✅ 이미 구현됨 |
| `src/lib/queryKeys.ts` | ✅ 이미 구현됨 |

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/features/products/components/SearchResults.tsx` | 생성 — TanStack Query로 검색 결과 표시 |
| `src/app/(shop)/search/page.tsx` | 수정 — Next.js 16 searchParams Promise 대응 |

---

## 구현 순서

### 1. SearchResults.tsx 생성

`ProductCard` 컴포넌트가 별도 파일로 없으므로 `ProductGrid`에 keyword prop을 전달한다.

```tsx
// src/features/products/components/SearchResults.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import ProductGrid from './ProductGrid';

export default function SearchResults({ keyword }: { keyword: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6">
        "{keyword}" 검색 결과
      </p>
      <ProductGrid keyword={keyword} />
    </div>
  );
}
```

### 2. /search/page.tsx 수정

> **⚠️ Next.js 16**: `searchParams`는 `Promise`이므로 반드시 `await` 필요.

```tsx
// src/app/(shop)/search/page.tsx
interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const keyword = q ?? '';

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {keyword ? `"${keyword}" 검색 결과` : '검색'}
      </h1>
      {keyword ? (
        <SearchResults keyword={keyword} />
      ) : (
        <p className="text-muted-foreground">검색어를 입력해주세요.</p>
      )}
    </div>
  );
}
```

> `SearchResults`는 `ProductGrid`에 `keyword` prop을 전달하므로
> API Route의 keyword 필터가 자동으로 적용된다.
