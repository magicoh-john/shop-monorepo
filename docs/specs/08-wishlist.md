# 스펙 08 — 위시리스트 & 최근 본 상품 (Zustand)

## 목표
찜하기(위시리스트)와 최근 본 상품을 Zustand로 구현한다.
모두 localStorage에 저장하여 새로고침 후에도 유지된다.

## 완료 기준
- 상품 상세 페이지에서 하트 버튼으로 위시리스트 추가/제거가 된다
- 찜 상태에 따라 버튼 색상이 변경된다 (활성: 빨강, 비활성: 기본)
- 상품 상세 페이지 방문 시 자동으로 최근 본 상품에 저장된다 (이미 구현됨)
- 홈 화면 "개인 추천상품" 섹션에 최근 본 상품이 표시된다

---

## DB 스키마 변경

없음. 클라이언트(Zustand + localStorage)로만 관리한다.

---

## 사전 구현 현황

| 항목 | 상태 |
|---|---|
| `src/store/recentStore.ts` | ✅ 이미 구현됨 |
| `src/features/products/components/RecentTracker.tsx` | ✅ 이미 구현됨 |
| `src/features/products/components/RecentProducts.tsx` | ✅ 이미 구현됨 |
| `src/features/products/components/ProductActions.tsx` | ✅ [찜하기] UI 버튼 있음 (기능 미연결) |

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/store/wishlistStore.ts` | 생성 |
| `src/features/products/components/WishlistButton.tsx` | 생성 |
| `src/features/products/components/ProductActions.tsx` | 수정 — 인라인 찜하기 버튼 → WishlistButton으로 교체 |

---

## 구현 순서

### 1. wishlistStore.ts 생성

```ts
// src/store/wishlistStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@my-project/types';

interface WishlistStore {
  items: Product[];
  toggle: (product: Product) => void;
  isWished: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) =>
        set((state) => {
          const exists = state.items.some((i) => i.id === product.id);
          return {
            items: exists
              ? state.items.filter((i) => i.id !== product.id)
              : [...state.items, product],
          };
        }),

      isWished: (productId) => get().items.some((i) => i.id === productId),
    }),
    { name: 'wishlist-storage' }
  )
);
```

### 2. WishlistButton.tsx 생성

```tsx
// src/features/products/components/WishlistButton.tsx
'use client';

import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import type { Product } from '@my-project/types';

export default function WishlistButton({ product }: { product: Product }) {
  const { toggle, isWished } = useWishlistStore();
  const wished = isWished(product.id);

  return (
    <button
      type="button"
      onClick={() => toggle(product)}
      className={`w-full border py-3 rounded-[calc(var(--radius)-2px)] font-medium transition-colors flex items-center justify-center gap-2 ${
        wished
          ? 'border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground'
          : 'border-border text-foreground hover:bg-accent'
      }`}
    >
      <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
      {wished ? '찜 해제' : '찜하기'}
    </button>
  );
}
```

### 3. ProductActions.tsx 수정

기존 인라인 찜하기 버튼을 `WishlistButton`으로 교체한다.

```tsx
// 변경 전
import { Heart } from 'lucide-react';
// ...
<button type="button" className="...">
  <Heart size={16} />
  찜하기
</button>

// 변경 후
import WishlistButton from './WishlistButton';
// ...
<WishlistButton product={product} />
```
