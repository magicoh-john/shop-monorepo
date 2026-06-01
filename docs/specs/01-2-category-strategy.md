# 스펙 01-2 — 카테고리 시스템

## 목표
Category 테이블을 도입하여 대/중카테고리 2단계 계층을 구성하고,
Product를 String category에서 Category 관계로 전환한다.
홈 화면 섹션 구조도 이 스펙에서 함께 완성한다.

## 완료 기준
- Category 테이블 생성 및 대/중카테고리 seed 완료
- Product가 categoryId로 Category와 연결됨
- Header 카테고리 탭이 DB 대카테고리 기준으로 표시됨
- 홈 퀵 카테고리 아이콘이 DB 대카테고리 기준으로 표시됨
- `/categories/[slug]` 페이지에서 카테고리별 상품 필터링 동작
- 홈 화면 4섹션 구조 완성 (개인추천/신상품/베스트/전체)

---

## 카테고리 vs 큐레이션 분리 원칙

| 구분 | 정의 | 구현 위치 |
|---|---|---|
| **카테고리** | 상품이 무엇인가 (분류) | Category 테이블 → DB |
| **큐레이션** | 상품의 특성/상태 (필터) | 홈 화면 쿼리 섹션 |

오늘특가/신상품/베스트는 카테고리가 아니므로 Category 테이블에 넣지 않는다.

---

## 최종 카테고리 구조 (확정)

### 대카테고리 5개

| 순서 | 이름 | slug | emoji |
|---|---|---|---|
| 1 | 패션의류 | fashion | 👗 |
| 2 | 신발/가방 | shoes-bags | 👟 |
| 3 | 액세서리 | accessories | 💍 |
| 4 | 뷰티 | beauty | 💄 |
| 5 | 스포츠 | sports | ⚽ |

### 중카테고리 10개 (부모 연결 포함)

| 순서 | 이름 | slug | 부모(대카테고리) |
|---|---|---|---|
| 1 | 상의 | tops | 패션의류 |
| 2 | 하의 | bottoms | 패션의류 |
| 3 | 신발 | shoes | 신발/가방 |
| 4 | 가방 | bags | 신발/가방 |
| 5 | 주얼리 | jewelry | 액세서리 |
| 6 | 모자/스카프 | hats | 액세서리 |
| 7 | 스킨케어 | skincare | 뷰티 |
| 8 | 메이크업 | makeup | 뷰티 |
| 9 | 운동용품 | equipment | 스포츠 |
| 10 | 운동복/용품 | sportswear | 스포츠 |

### 상품 50개 카테고리 매핑

| 상품명 | 중카테고리 |
|---|---|
| 클래식 화이트 티셔츠, 오버핏 후드티, 울 가디건, 플리스 집업, 스트라이프 셔츠, 린넨 반팔 셔츠, 터틀넥 니트, 맨투맨, 체크 플란넬 셔츠, 크롭 탱크탑 | 상의 |
| 슬림핏 청바지, 린넨 와이드 팬츠, 카고 팬츠, 코튼 반바지, 슬랙스, 레깅스, 미니 스커트, 롱 플리츠 스커트 | 하의 |
| 캔버스 스니커즈, 로퍼, 첼시 부츠, 러닝화, 슬립온, 샌들, 앵클 부츠 | 신발 |
| 레더 미니백, 캔버스 토트백, 백팩, 클러치백, 숄더백, 에코백 | 가방 |
| 실버 체인 목걸이, 골드 귀걸이, 가죽 벨트, 손목시계 | 주얼리 |
| 버킷햇, 울 비니, 선글라스, 스카프 | 모자/스카프 |
| 수분 크림, 선크림 SPF50+, 에센스 세럼, 클렌징 폼 | 스킨케어 |
| 립스틱 | 메이크업 |
| 요가 매트, 덤벨 세트, 운동용 장갑, 스포츠 양말, 폼롤러, 물통 | 운동용품 |

---

## DB 스키마 변경

### 1. Category 모델 추가

```prisma
model Category {
  id        String  @id @default(cuid())
  name      String
  slug      String  @unique
  emoji     String?
  parentId  String?
  sortOrder Int     @default(0)

  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  products Product[]

  @@map("categories")
}
```

### 2. Product 모델 변경

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Int
  stock       Int      @default(0)
  imageUrl    String?
  createdAt   DateTime @default(now())

  categoryId  String?              // ← 추가
  category    Category? @relation(fields: [categoryId], references: [id])  // ← 추가

  // category  String?  ← 제거
  orderItems  OrderItem[]
  cartItems   CartItem[]

  @@map("products")
}
```

### 마이그레이션

```bash
cd packages/database
npx prisma migrate dev --name add-category-table
npx prisma generate   # ← 반드시 실행! Client 재생성 없이 seed 실행 시 오류 발생
```

---

## packages/types 변경

### Category 인터페이스 추가

```ts
// packages/types/src/product.ts 에 추가
export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
  parentId?: string;
  sortOrder: number;
  children?: Category[];
}
```

### Product 인터페이스 변경

```ts
export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  stock: number;
  createdAt: string;
  categoryId?: string;        // ← 추가
  category?: Category;        // ← 추가 (관계)
}
```

---

## seed.ts 구조

```ts
// 1단계: 대카테고리 생성
const [fashion, shoesBags, accessories, beauty, sports] =
  await Promise.all([
    prisma.category.create({ data: { name: '패션의류', slug: 'fashion', emoji: '👗', sortOrder: 1 } }),
    prisma.category.create({ data: { name: '신발/가방', slug: 'shoes-bags', emoji: '👟', sortOrder: 2 } }),
    prisma.category.create({ data: { name: '액세서리', slug: 'accessories', emoji: '💍', sortOrder: 3 } }),
    prisma.category.create({ data: { name: '뷰티', slug: 'beauty', emoji: '💄', sortOrder: 4 } }),
    prisma.category.create({ data: { name: '스포츠', slug: 'sports', emoji: '⚽', sortOrder: 5 } }),
  ]);

// 2단계: 중카테고리 생성 (parentId 연결)
const [tops, bottoms, shoes, bags, jewelry, hats, skincare, makeup, equipment] =
  await Promise.all([
    prisma.category.create({ data: { name: '상의', slug: 'tops', parentId: fashion.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: '하의', slug: 'bottoms', parentId: fashion.id, sortOrder: 2 } }),
    prisma.category.create({ data: { name: '신발', slug: 'shoes', parentId: shoesBags.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: '가방', slug: 'bags', parentId: shoesBags.id, sortOrder: 2 } }),
    prisma.category.create({ data: { name: '주얼리', slug: 'jewelry', parentId: accessories.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: '모자/스카프', slug: 'hats', parentId: accessories.id, sortOrder: 2 } }),
    prisma.category.create({ data: { name: '스킨케어', slug: 'skincare', parentId: beauty.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: '메이크업', slug: 'makeup', parentId: beauty.id, sortOrder: 2 } }),
    prisma.category.create({ data: { name: '운동용품', slug: 'equipment', parentId: sports.id, sortOrder: 1 } }),
  ]);

// 3단계: 상품 생성 (categoryId 연결)
await prisma.product.createMany({
  data: [
    { name: '클래식 화이트 티셔츠', price: 29000, stock: 100, categoryId: tops.id, imageUrl: img(1) },
    // ...
  ],
});
```

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `packages/database/prisma/schema.prisma` | Category 추가, Product 변경 |
| `packages/database/prisma/seed.ts` | 카테고리 + 상품 50개 재매핑 |
| `packages/types/src/product.ts` | Category, Product 인터페이스 변경 |
| `packages/types/src/index.ts` | Category re-export 추가 |
| `src/components/layout/CategoryNav.tsx` | 서버 컴포넌트 + 클라이언트 분리 |
| `src/app/(shop)/page.tsx` | 홈 4섹션 + DB 카테고리 기반 퀵 아이콘 |
| `src/app/(shop)/categories/[slug]/page.tsx` | 카테고리 상품 필터링 페이지 |
| `src/store/recentStore.ts` | 최근 본 상품 Zustand 스토어 |
| `src/features/products/components/RecentProducts.tsx` | 개인 추천상품 클라이언트 컴포넌트 |

---

## 패키지 설치

```bash
# apps/web 디렉토리에서
cd apps/web
pnpm add zustand
```

---

## 구현 순서

1. 패키지 설치 (`zustand`)
2. `schema.prisma` 수정
2. `npx prisma migrate dev --name add-category-table`
3. `packages/types` 수정
4. `seed.ts` 수정 → `npx prisma db seed`
5. `CategoryNav.tsx` DB 기반으로 변경
6. `recentStore.ts` + `RecentProducts.tsx` 생성
7. `(shop)/page.tsx` 홈 4섹션 구조로 변경
8. `categories/[slug]/page.tsx` 구현

---

## 홈 화면 최종 섹션 구조

```
배너 슬라이더
퀵 카테고리 (DB 대카테고리 5개)
─────────────────────────────
개인 추천상품  ← recentStore (최근 본 상품, 없으면 숨김)
신상품         ← createdAt DESC 8개
베스트상품     ← orderItems 수 DESC 8개
전체상품       ← 최신 12개 + /products 전체보기
```
