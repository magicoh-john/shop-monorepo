# 스펙 11 — 보안 취약점 수정 (주문 가격 서버 검증)

## 목표

`createOrder` Server Action이 클라이언트(Zustand)에서 전달한 가격을 그대로 DB에 저장하는
취약점을 수정한다. 서버에서 DB 가격을 직접 조회하여 가격 조작을 차단한다.

---

## 완료 기준

- 주문 생성 시 상품 가격이 DB에서 조회된 값으로 저장된다
- 클라이언트가 `price`를 변조해 전송해도 DB에 저장된 실제 가격으로 처리된다
- 존재하지 않는 `productId`로 주문 시도 시 에러가 반환된다

---

## 취약점 — 주문 가격 클라이언트 신뢰

### 문제

```ts
// CheckoutForm.tsx (클라이언트)
await createOrder(data, items);  // items[].price = Zustand 장바구니 값

// order.actions.ts (서버) ← 클라이언트 price를 그대로 사용
const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
await prisma.order.create({
  data: {
    totalPrice,              // ← 조작된 가격이 저장될 수 있음
    orderItems: {
      create: items.map((i) => ({
        price: i.price,      // ← 조작된 가격
      })),
    },
  },
});
```

브라우저 개발자 도구로 Server Action 호출을 직접 조작하면 `price: 1`로 주문을 완료할 수 있다.

### 수정 방법

서버에서 `productId`와 `quantity`만 받고, **가격은 DB에서 직접 조회**한다.

```
클라이언트가 전달          서버에서 처리
─────────────────         ─────────────────────────────
productId (신뢰 O)   →    DB에서 product.price 조회
quantity  (신뢰 O)   →    quantity 범위 검증 (1~99)
price     (제거)          DB 가격 × quantity = 실제 금액
```

---

## DB 스키마 변경

없음.

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/features/order/order.actions.ts` | 수정 — `createOrder` 가격 서버 검증 |
| `src/features/order/components/CheckoutForm.tsx` | 수정 — `items`에서 `price` 제거 |

---

## 구현 순서

### 1. `createOrder` 수정 — 가격 서버 검증

**인터페이스 변경**: 클라이언트에서 `price`를 받지 않는다.

```ts
// 수정 전
interface OrderItemInput {
  productId: string;
  price: number;      // ← 클라이언트 신뢰 (취약)
  quantity: number;
}

// 수정 후
interface OrderItemInput {
  productId: string;
  quantity: number;   // ← productId + quantity만 수신
}
```

**`createOrder` 구현 변경**:

```ts
export async function createOrder(formData: OrderFormData, items: OrderItemInput[]) {
  const session = await auth();
  if (!session) redirect('/login');

  const validated = orderSchema.safeParse(formData);
  if (!validated.success) throw new Error('입력값이 올바르지 않습니다.');

  // quantity 범위 검증
  for (const item of items) {
    if (item.quantity < 1 || item.quantity > 99) {
      throw new Error('수량은 1~99개 사이여야 합니다.');
    }
  }

  // DB에서 실제 상품 가격 조회 — 클라이언트 price 불신
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true },
  });

  const priceMap = new Map(products.map((p) => [p.id, p.price]));

  // 존재하지 않는 상품 검증
  for (const item of items) {
    if (!priceMap.has(item.productId)) {
      throw new Error(`존재하지 않는 상품입니다: ${item.productId}`);
    }
  }

  // 서버에서 계산한 총액 사용
  const totalPrice = items.reduce((sum, item) => {
    return sum + priceMap.get(item.productId)! * item.quantity;
  }, 0);

  await prisma.order.create({
    data: {
      userId: session.user.id,
      statusCode: 'PAID',
      receiverName: validated.data.receiverName,
      receiverPhone: validated.data.receiverPhone,
      address: validated.data.address,
      totalPrice,
      orderItems: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: priceMap.get(item.productId)!,  // DB 가격 사용
        })),
      },
    },
  });

  revalidatePath('/mypage');
}
```

---

### 2. `CheckoutForm.tsx` 수정 — `price` 제거

`createOrder` 호출 시 `items`에서 `price`를 제거한다.

```ts
// 수정 전
await createOrder(data, items);
// items = [{ productId, productName, price, quantity, imageUrl }]

// 수정 후
const orderItems = items.map(({ productId, quantity }) => ({ productId, quantity }));
await createOrder(data, orderItems);
```

---

## 검증 방법

1. 브라우저 개발자 도구에서 Server Action 페이로드의 `price` 값을 `1`로 변조 후 주문
2. 마이페이지에서 실제 상품 가격으로 주문이 저장되었는지 확인
