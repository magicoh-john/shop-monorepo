# 스펙 03 — 장바구니 (Zustand)

## 목표
Zustand로 클라이언트 장바구니를 구현한다.
localStorage에 저장하여 새로고침 후에도 유지된다.

## 완료 기준
- 상품 상세 페이지에서 수량을 선택한 뒤 [장바구니 담기]가 동작한다
- 상품 상세 페이지에서 [주문하기]를 누르면 장바구니에 담고 `/checkout`으로 이동한다
- `/cart` 페이지에서 담긴 상품 목록, 수량 조절, 삭제가 된다
- 총 결제 금액이 자동 계산된다
- Header의 장바구니 아이콘에 담긴 수량이 표시된다

---

## DB 스키마 변경

없음. 장바구니는 클라이언트(Zustand + localStorage)로만 관리한다.

> DB의 Cart/CartItem 모델은 현재 사용하지 않는다.

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/store/cartStore.ts` | 생성 — Zustand 스토어 |
| `src/features/products/components/ProductActions.tsx` | 생성 — 수량 조절 + [주문하기] + [장바구니 담기] + [찜하기] UI |
| `src/app/(shop)/products/[id]/page.tsx` | 수정 — ProductActions 연동, 리뷰·상세정보 섹션 추가 |
| `src/app/(shop)/cart/page.tsx` | 수정 |
| `src/components/layout/CartIcon.tsx` | 생성 — 장바구니 수량 뱃지 클라이언트 컴포넌트 |
| `src/components/layout/Header.tsx` | 수정 — CartIcon 연동 |

> **파일 위치 규칙**: 스토어는 도메인 feature 폴더가 아닌 `src/store/`에 둔다.
> `src/store/cartStore.ts`로 생성한다.

> **AddToCartButton.tsx**: `ProductActions.tsx`로 역할이 통합됐다. 단독 사용이 필요한 경우를 위해 파일은 유지하되 ProductActions를 우선 사용한다.

---

## 구현 순서

### 1. cartStore.ts 생성

```ts
// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.productId === item.productId);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          };
        }
        return { items: [...state.items, item] };
      }),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
);
```

### 2. AddToCartButton.tsx 생성

```tsx
// src/features/products/components/AddToCartButton.tsx
'use client';

import { useCartStore } from '@/store/cartStore';
import type { Product } from '@my-project/types';

export default function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl ?? undefined,
    });
    alert('장바구니에 추가되었습니다.');
  };

  return (
    <button
      onClick={handleAdd}
      disabled={product.stock === 0}
      className="w-full bg-primary text-primary-foreground py-3 rounded-[calc(var(--radius)-2px)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {product.stock === 0 ? '품절' : '장바구니 담기'}
    </button>
  );
}
```

### 3. /cart/page.tsx 수정

```tsx
// src/app/(shop)/cart/page.tsx
'use client';

import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 text-center">
        <p className="text-muted-foreground">장바구니가 비어있습니다.</p>
        <Link href="/products" className="text-primary mt-4 inline-block">상품 보러가기</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-6">장바구니</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 bg-card border border-border rounded-[var(--radius)] p-4">
            <div className="flex-1">
              <p className="font-medium text-foreground">{item.productName}</p>
              <p className="text-sm text-muted-foreground">{item.price.toLocaleString()}원</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                className="w-8 h-8 border border-border rounded flex items-center justify-center"
              >-</button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="w-8 h-8 border border-border rounded flex items-center justify-center"
              >+</button>
            </div>
            <p className="font-semibold w-24 text-right">{(item.price * item.quantity).toLocaleString()}원</p>
            <button onClick={() => removeItem(item.productId)} className="text-destructive text-sm">삭제</button>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <p className="text-lg font-bold">총 합계</p>
        <p className="text-xl font-bold text-primary">{totalPrice().toLocaleString()}원</p>
      </div>
      <Link
        href="/checkout"
        className="mt-4 block w-full bg-primary text-primary-foreground py-3 rounded-[calc(var(--radius)-2px)] text-center font-medium hover:opacity-90 transition-opacity"
      >
        주문하기
      </Link>
    </div>
  );
}
```
