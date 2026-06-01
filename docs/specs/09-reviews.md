# 스펙 09 — 상품 리뷰 & 별점

## 목표
구매 완료된 상품에 리뷰와 별점을 작성하고, 상품 상세 페이지에 표시한다.
TanStack Query의 낙관적 업데이트(Optimistic Update)를 적용한다.

## 완료 기준
- 마이페이지에서 배송완료 주문의 상품에 리뷰를 작성할 수 있다
- 상품 상세 페이지에 리뷰 목록과 평균 별점이 표시된다
- 리뷰 작성 직후 목록에 즉시 반영된다 (낙관적 업데이트)

---

## DB 스키마 변경

`Review` 모델을 추가한다.

> **⚠️ DB 컬럼 규칙**: 모든 camelCase 필드에 `@map("snake_case")` 필수.

```prisma
model Review {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  productId String   @map("product_id")
  orderId   String   @map("order_id")
  rating    Int
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  user    User    @relation(fields: [userId], references: [id])
  product Product @relation(fields: [productId], references: [id])
  order   Order   @relation(fields: [orderId], references: [id])

  @@unique([userId, productId, orderId])
  @@map("reviews")
}
```

User, Product, Order 모델에 역참조 추가:

```prisma
// User 모델에
reviews Review[]

// Product 모델에
reviews Review[]

// Order 모델에
reviews Review[]
```

스키마 변경 후 마이그레이션:

```bash
cd packages/database
npx prisma migrate dev --name add-review
npx prisma generate
```

---

## packages/types 업데이트

```ts
// packages/types/src/product.ts 에 추가
export interface Review {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  rating: number;
  content: string;
  createdAt: string;
  user: { name: string };
}
```

`packages/types/src/index.ts`에 `Review` re-export 확인.

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `packages/database/prisma/schema.prisma` | 수정 — Review 모델 추가 (snake_case @map 포함) |
| `packages/types/src/product.ts` | 수정 — Review 인터페이스 추가 |
| `src/app/api/products/[id]/reviews/route.ts` | 생성 — GET, POST |
| `src/features/products/components/ReviewList.tsx` | 생성 |
| `src/features/products/components/ReviewForm.tsx` | 생성 |
| `src/lib/queryKeys.ts` | 확인 — reviews 키 이미 존재 |

---

## 구현 순서

### 1. API Route 생성

> **⚠️ Next.js 16**: `params`는 `Promise`이므로 반드시 `await` 필요.

```ts
// src/app/api/products/[id]/reviews/route.ts
import { prisma } from '@my-project/database';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reviews = await prisma.review.findMany({
    where: { productId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(reviews);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { orderId, rating, content } = await req.json();

  // 구매 인증
  const orderItem = await prisma.orderItem.findFirst({
    where: { orderId, productId: id, order: { userId: session.user.id } },
  });
  if (!orderItem) return Response.json({ error: '구매한 상품만 리뷰를 작성할 수 있습니다.' }, { status: 403 });

  const review = await prisma.review.create({
    data: { userId: session.user.id, productId: id, orderId, rating, content },
    include: { user: { select: { name: true } } },
  });

  return Response.json(review);
}
```

### 2. ReviewList.tsx — TanStack Query + 낙관적 업데이트

```tsx
// src/features/products/components/ReviewList.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { Review } from '@my-project/types';

export default function ReviewList({ productId }: { productId: string }) {
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: queryKeys.reviews.byProduct(productId),
    queryFn: () => fetch(`/api/products/${productId}/reviews`).then((r) => r.json()),
  });

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-foreground">리뷰</h3>
        {avgRating && (
          <span className="text-sm text-muted-foreground">
            평균 ★ {avgRating} ({reviews.length}개)
          </span>
        )}
      </div>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 리뷰가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-[var(--radius)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{review.user.name}</span>
                <span className="text-sm text-muted-foreground">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              <p className="text-sm text-foreground">{review.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```
