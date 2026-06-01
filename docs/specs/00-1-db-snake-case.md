# 스펙 00-1 — DB 컬럼명 snake_case 전면 적용

## 목표
PostgreSQL 표준에 맞게 모든 DB 컬럼명을 snake_case로 통일한다.
Prisma의 `@map()`을 활용해 Prisma 코드(camelCase)와 DB 컬럼(snake_case)을 분리한다.

## 배경
현재 schema.prisma에서 camelCase 필드명에 `@map()`이 없으면 Prisma가 DB 컬럼명에 큰따옴표를 강제로 붙인다.
이는 PostgreSQL 표준을 벗어나며 SQL 쿼리 작성 시 혼란을 유발한다.

```sql
-- ❌ 현재 (큰따옴표 강제)
SELECT "createdAt", "imageUrl" FROM products;

-- ✅ 목표 (표준 snake_case)
SELECT created_at, image_url FROM products;
```

## 완료 기준
- 모든 모델의 camelCase 컬럼에 `@map("snake_case")` 적용
- 마이그레이션 생성 및 적용
- 기존 앱 코드(TypeScript)는 변경 없음 (Prisma Client는 여전히 camelCase 사용)

---

## 변경 대상 전체 목록

### User
| 필드 | DB 컬럼 (현재) | DB 컬럼 (변경) |
|---|---|---|
| `createdAt` | `"createdAt"` | `created_at` |

### Category
| 필드 | DB 컬럼 (현재) | DB 컬럼 (변경) |
|---|---|---|
| `parentId` | `"parentId"` | `parent_id` |
| `sortOrder` | `"sortOrder"` | `sort_order` |

### Product
| 필드 | DB 컬럼 (현재) | DB 컬럼 (변경) |
|---|---|---|
| `productId` | `product_id` | ✅ 완료 |
| `imageUrl` | `"imageUrl"` | `image_url` |
| `createdAt` | `"createdAt"` | `created_at` |
| `categoryId` | `"categoryId"` | `category_id` |

### SystemCode
| 필드 | DB 컬럼 (현재) | DB 컬럼 (변경) |
|---|---|---|
| `groupCode` | `"groupCode"` | `group_code` |
| `groupLabel` | `"groupLabel"` | `group_label` |
| `sortOrder` | `"sortOrder"` | `sort_order` |

### Order
| 필드 | DB 컬럼 (현재) | DB 컬럼 (변경) |
|---|---|---|
| `userId` | `"userId"` | `user_id` |
| `statusCode` | `"statusCode"` | `status_code` |
| `receiverName` | `"receiverName"` | `receiver_name` |
| `receiverPhone` | `"receiverPhone"` | `receiver_phone` |
| `totalPrice` | `"totalPrice"` | `total_price` |
| `createdAt` | `"createdAt"` | `created_at` |

### OrderItem
| 필드 | DB 컬럼 (현재) | DB 컬럼 (변경) |
|---|---|---|
| `orderId` | `"orderId"` | `order_id` |
| `productId` | `"productId"` | `product_id` |

### Cart
| 필드 | DB 컬럼 (현재) | DB 컬럼 (변경) |
|---|---|---|
| `userId` | `"userId"` | `user_id` |
| `createdAt` | `"createdAt"` | `created_at` |

### CartItem
| 필드 | DB 컬럼 (현재) | DB 컬럼 (변경) |
|---|---|---|
| `cartId` | `"cartId"` | `cart_id` |
| `productId` | `"productId"` | `product_id` |

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `packages/database/prisma/schema.prisma` | 전체 camelCase 필드에 `@map()` 추가 |

---

## 구현 순서

### 1. schema.prisma 수정
위 목록의 모든 필드에 `@map("snake_case")` 추가.

### 2. 마이그레이션 실행 (터미널에서 직접)

```bash
cd packages/database
npx prisma migrate dev --name apply-snake-case-columns
npx prisma generate
npx prisma db seed
```

> **주의**: 기존 데이터가 있으면 `migrate reset` 후 진행.

---

## 앱 코드 영향 없음

`@map()`은 DB 레벨만 변경하며 Prisma Client API는 동일하다.

```ts
// 변경 전후 동일하게 사용 가능
const product = await prisma.product.findFirst();
product.imageUrl   // ← Prisma 코드는 그대로 camelCase
product.createdAt  // ← 변경 없음
```
