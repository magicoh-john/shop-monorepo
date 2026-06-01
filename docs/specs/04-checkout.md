# 스펙 04 — 주문 & 결제

## 목표
장바구니 상품을 주문으로 전환한다.
배송지 입력 → Server Action → DB 트랜잭션 저장까지 완성한다.

## 완료 기준
- `/checkout` 페이지에서 장바구니 상품 목록과 총 금액이 보인다
- 배송지 정보(이름, 전화번호, 주소) 입력 및 Zod 검증이 된다
- 주문 완료 시 Order + OrderItem이 DB에 저장된다
- 주문 완료 후 장바구니가 비워진다
- 주문 완료 페이지 또는 마이페이지로 리다이렉트된다

---

## DB 스키마 변경

없음. 기존 Order, OrderItem, SystemCode 모델 사용.

> 주문 초기 상태는 SystemCode 테이블의 '결제완료' 코드를 사용한다.
> seed.ts에 초기 SystemCode 데이터가 있어야 한다. (스펙 실행 전 확인)

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/features/order/order.actions.ts` | 생성 — 주문 생성 Server Action |
| `src/features/order/components/CheckoutForm.tsx` | 생성 |
| `src/app/(protected)/checkout/page.tsx` | 수정 |

---

## 구현 순서

### 1. order.actions.ts 생성

```ts
// src/features/order/order.actions.ts
'use server';

import { prisma } from '@my-project/database';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { orderSchema } from '@/schemas/order.schema';

interface OrderItemInput {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export async function createOrder(
  formData: { receiverName: string; receiverPhone: string; address: string },
  items: OrderItemInput[]
) {
  const session = await auth();
  if (!session) redirect('/login');

  const validated = orderSchema.safeParse(formData);
  if (!validated.success) throw new Error('입력값이 올바르지 않습니다.');

  // '결제완료' SystemCode 조회
  const statusCode = await prisma.systemCode.findFirst({
    where: { groupCode: 'ORDER_STATUS', code: 'PAID' },
  });
  if (!statusCode) throw new Error('주문 상태 코드를 찾을 수 없습니다.');

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  await prisma.order.create({
    data: {
      userId: session.user.id,
      statusCodeId: statusCode.id,
      receiverName: validated.data.receiverName,
      receiverPhone: validated.data.receiverPhone,
      address: validated.data.address,
      totalPrice,
      orderItems: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    },
  });

  redirect('/mypage');
}
```

### 2. CheckoutForm.tsx 생성

```tsx
// src/features/order/components/CheckoutForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderSchema, type OrderFormData } from '@/schemas/order.schema';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/features/order/order.actions';

export default function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCartStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  });

  const onSubmit = async (data: OrderFormData) => {
    await createOrder(data, items);
    clearCart();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">받는 분 이름</label>
        <input {...register('receiverName')} className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm" />
        {errors.receiverName && <p className="text-xs text-destructive mt-1">{errors.receiverName.message}</p>}
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">전화번호</label>
        <input {...register('receiverPhone')} placeholder="010-0000-0000" className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm" />
        {errors.receiverPhone && <p className="text-xs text-destructive mt-1">{errors.receiverPhone.message}</p>}
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">배송지 주소</label>
        <input {...register('address')} className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm" />
        {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
      </div>
      <div className="border-t border-border pt-4">
        <p className="text-lg font-bold">총 결제 금액: {totalPrice().toLocaleString()}원</p>
      </div>
      <button
        type="submit"
        disabled={isSubmitting || items.length === 0}
        className="w-full bg-primary text-primary-foreground py-3 rounded-[calc(var(--radius)-2px)] font-medium hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? '처리 중...' : '결제 완료'}
      </button>
    </form>
  );
}
```

### 3. /checkout/page.tsx 수정

```tsx
// src/app/(protected)/checkout/page.tsx
import CheckoutForm from '@/features/order/components/CheckoutForm';

export default function CheckoutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-6">주문 / 결제</h1>
      <CheckoutForm />
    </div>
  );
}
```

---

## 사전 조건

`packages/database/prisma/seed.ts`에 SystemCode 초기 데이터가 있어야 한다.

```ts
// 확인할 seed 데이터 예시
await prisma.systemCode.createMany({
  data: [
    { groupCode: 'ORDER_STATUS', groupLabel: '주문상태', code: 'PENDING', label: '결제대기', sortOrder: 1 },
    { groupCode: 'ORDER_STATUS', groupLabel: '주문상태', code: 'PAID', label: '결제완료', sortOrder: 2 },
    { groupCode: 'ORDER_STATUS', groupLabel: '주문상태', code: 'SHIPPING', label: '배송중', sortOrder: 3 },
    { groupCode: 'ORDER_STATUS', groupLabel: '주문상태', code: 'DELIVERED', label: '배송완료', sortOrder: 4 },
  ],
});
```
