# 스펙 02-2 — Product Business Key (productId) 추가

## 목표
상품 테이블에 비즈니스 식별자(`productId`)를 추가한다.
DB 내부 PK(`id`)와 쇼핑몰이 직접 관리하는 상품 코드를 분리하는 표준 패턴(Surrogate Key + Business Key)을 적용한다.

## 배경
현재 `Product` 모델은 내부 PK(`id`: cuid)만 존재한다.
실제 쇼핑몰에서는 재고 관리, 영수증, 거래처 공유 등에 사용하는 별도의 상품 코드가 필요하다.
내부 PK를 외부에 노출하면 DB 구조가 드러나고 보안에 취약해지므로 비즈니스 식별자를 분리한다.

## 완료 기준
- `Product` 테이블에 `productId String @unique` 컬럼이 추가된다
- seed 데이터 50개 상품에 `productId`가 부여된다 (`PROD-001` ~ `PROD-050`)
- 마이그레이션 파일이 생성된다

---

## DB 스키마 변경

```prisma
model Product {
  id          String   @id @default(cuid())
  productId   String   @unique               // ← 추가
  name        String
  description String?
  price       Int
  stock       Int      @default(0)
  imageUrl    String?
  createdAt   DateTime @default(now())

  categoryId  String?
  category    Category?  @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  cartItems   CartItem[]

  @@map("products")
}
```

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `packages/database/prisma/schema.prisma` | `productId String @unique` 추가 |
| `packages/database/prisma/seed.ts` | 상품 50개에 `productId` 값 추가 |

---

## 구현 순서

### 1. schema.prisma 수정

`Product` 모델에 `productId String @unique` 추가 (`id` 바로 아래).

### 2. seed.ts 수정

각 상품 객체에 `productId` 추가.

```
PROD-001 ~ PROD-010 : 상의 10개
PROD-011 ~ PROD-018 : 하의 8개
PROD-019 ~ PROD-025 : 신발 7개
PROD-026 ~ PROD-031 : 가방 6개
PROD-032 ~ PROD-035 : 주얼리 4개
PROD-036 ~ PROD-039 : 모자/스카프 4개
PROD-040 ~ PROD-043 : 스킨케어 4개
PROD-044 ~ PROD-047 : 메이크업 4개
PROD-048 ~ PROD-050 : 스포츠 3개 (나머지)
```

### 3. 마이그레이션 실행 (터미널에서 직접)

```bash
cd packages/database
npx prisma migrate dev --name add-product-business-id
npx prisma generate
npx prisma db seed
```

---

## 패키지 설치

없음.
