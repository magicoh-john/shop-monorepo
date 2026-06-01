# 스펙 05 — 마이페이지 & 주문 내역

## 목표
로그인한 사용자의 주문 내역을 보여주고 주문 취소 기능을 제공한다.

## 완료 기준
- `/mypage` 페이지에서 내 주문 목록이 최신순으로 표시된다
- 각 주문의 상태(배송 상태)가 표시된다
- '결제완료' 상태의 주문은 취소 버튼이 표시되고 취소가 된다
- 주문 취소 시 상태가 '주문취소'로 변경된다

---

## DB 스키마 변경

SystemCode에 '주문취소' 코드 추가 필요 (seed.ts 확인).

```ts
{ groupCode: 'ORDER_STATUS', code: 'CANCELLED', label: '주문취소', sortOrder: 5 }
```

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/app/api/order/route.ts` | 수정 — 내 주문 목록 GET |
| `src/features/order/order.actions.ts` | 수정 — 주문 취소 Action 추가 |
| `src/features/order/components/OrderList.tsx` | 생성 |
| `src/features/order/components/OrderCard.tsx` | 생성 |
| `src/app/(protected)/mypage/page.tsx` | 수정 |

---

## 구현 순서

### 1. GET /api/order — 내 주문 목록

```ts
// src/app/api/order/route.ts
import { prisma } from '@my-project/database';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      status: true,
      orderItems: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json(orders);
}
```

### 2. cancelOrder Action 추가

```ts
// src/features/order/order.actions.ts 에 추가
export async function cancelOrder(orderId: string) {
  const session = await auth();
  if (!session) redirect('/login');

  const cancelCode = await prisma.systemCode.findFirst({
    where: { groupCode: 'ORDER_STATUS', code: 'CANCELLED' },
  });
  if (!cancelCode) throw new Error('취소 코드를 찾을 수 없습니다.');

  await prisma.order.updateMany({
    where: {
      id: orderId,
      userId: session.user.id,  // 본인 주문만 취소 가능
    },
    data: { statusCodeId: cancelCode.id },
  });

  revalidatePath('/mypage');
}
```

### 3. OrderCard.tsx 생성

```tsx
// src/features/order/components/OrderCard.tsx
'use client';

import { cancelOrder } from '@/features/order/order.actions';

interface OrderCardProps {
  order: {
    id: string;
    createdAt: string;
    totalPrice: number;
    status: { label: string; code: string };
    orderItems: { product: { name: string }; quantity: number; price: number }[];
  };
}

export default function OrderCard({ order }: OrderCardProps) {
  const canCancel = order.status.code === 'PAID';

  return (
    <div className="bg-card border border-border rounded-[var(--radius)] p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
        <span className="text-sm font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-[calc(var(--radius)-4px)]">
          {order.status.label}
        </span>
      </div>
      <div className="space-y-2 mb-4">
        {order.orderItems.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-foreground">{item.product.name} × {item.quantity}</span>
            <span className="text-muted-foreground">{(item.price * item.quantity).toLocaleString()}원</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <p className="font-semibold">합계: {order.totalPrice.toLocaleString()}원</p>
        {canCancel && (
          <button
            onClick={() => cancelOrder(order.id)}
            className="text-sm text-destructive border border-destructive rounded-[calc(var(--radius)-2px)] px-3 py-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            주문 취소
          </button>
        )}
      </div>
    </div>
  );
}
```

### 4. /mypage/page.tsx 수정

```tsx
// src/app/(protected)/mypage/page.tsx
import { prisma } from '@my-project/database';
import { auth } from '@/auth';
import OrderCard from '@/features/order/components/OrderCard';

export default async function MyPage() {
  const session = await auth();

  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id },
    include: {
      status: true,
      orderItems: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-6">마이페이지</h1>
      <h2 className="text-xl font-semibold text-foreground mb-4">주문 내역</h2>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">주문 내역이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order as any} />
          ))}
        </div>
      )}
    </div>
  );
}
```
