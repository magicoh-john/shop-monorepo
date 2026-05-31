# ARCHITECTURE.md — 쇼핑몰 모노레포 구조 가이드

**최종 수정**: 2026-05-31
**목적**: 전체 프로젝트 구조와 각 파일의 역할을 이해하고, 새 파일을 만들 때 어디에 두어야 할지 스스로 판단할 수 있도록 한다.

> ✅ 완료 — 현재 프로젝트에 실제로 존재하는 파일/폴더
> 🔲 예정 — PRD 기준 앞으로 추가될 파일/폴더

---

## 1. 전체 모노레포 구조

```
my-monorepo/
├── apps/
│   └── web/                        ✅ Next.js 풀스택 웹 앱
│
├── packages/
│   ├── database/                   ✅ Prisma ORM + PostgreSQL 클라이언트
│   └── types/                      ✅ 앱 간 공유 TypeScript 인터페이스
│
├── pnpm-workspace.yaml             ✅ 워크스페이스 패키지 경로 선언
├── package.json                    ✅ 루트 스크립트 (pnpm --filter web dev)
└── CLAUDE.md                       ✅ AI 행동 규칙 (기술 스택, 버전, 명령어)
```

---

## 2. packages/ 구조

### packages/database/
```
packages/database/
├── prisma/
│   ├── schema.prisma               ✅ DB 테이블 정의 (엔티티, 관계)
│   ├── seed.ts                     ✅ 초기 데이터 삽입 스크립트
│   └── migrations/                 ✅ 마이그레이션 이력
├── src/
│   └── client.ts                   ✅ Prisma Client 싱글톤 export
├── prisma.config.ts                ✅ Prisma 설정 (dotenv, 스키마 경로)
└── .env                            ✅ DATABASE_URL (Git 제외)
```

### packages/types/
```
packages/types/
└── src/
    ├── auth.ts                     ✅ User, Session 인터페이스
    ├── product.ts                  ✅ Product, ProductListResponse 인터페이스
    ├── order.ts                    ✅ CartItem, OrderItem, Order, ApiResponse 인터페이스
    └── index.ts                    ✅ 전체 re-export
```

> **설계 원칙**: `packages/types`에는 인터페이스(타입)만 둔다. Zod 스키마는 앱마다 유효성 검사 규칙이 다를 수 있으므로 각 앱 내부(`apps/web/src/schemas/`)에 둔다.

---

## 3. apps/web/src/ 구조

```
src/
├── proxy.ts                        ✅ 라우트 접근 권한 제어 (Next.js 16 — middleware.ts 대체)
├── auth.ts                         ✅ NextAuth 메인 설정 — auth, signIn, signOut, handlers export
├── auth.config.ts                  ✅ Edge 호환 설정 — proxy.ts와 공유 (Prisma import 금지)
│
├── app/
│   ├── layout.tsx                  ✅ 전체 앱 루트 레이아웃 (폰트, Provider 등)
│   ├── globals.css                 ✅ 전역 스타일 (Tailwind base)
│   ├── not-found.tsx               ✅ 전역 404 페이지
│   ├── error.tsx                   ✅ 전역 에러 바운더리
│   │
│   ├── (shop)/                     ✅ 비로그인 접근 가능 (헤더 + 푸터)
│   │   ├── layout.tsx              ✅
│   │   ├── page.tsx                ✅ 홈 (/)
│   │   ├── products/
│   │   │   ├── page.tsx            ✅ 상품 목록 (/products)
│   │   │   └── [id]/page.tsx       ✅ 상품 상세 (/products/[id])
│   │   ├── cart/page.tsx           ✅ 장바구니 (/cart)
│   │   ├── search/page.tsx         ✅ 검색 결과 (/search?q=...)
│   │   └── categories/
│   │       ├── page.tsx            ✅ 전체 카테고리 (/categories)
│   │       └── [slug]/page.tsx     ✅ 카테고리별 상품 (/categories/[slug])
│   │
│   ├── (auth)/                     ✅ 인증 페이지 (헤더/푸터 없는 심플 레이아웃)
│   │   ├── layout.tsx              ✅
│   │   ├── login/page.tsx          ✅ 로그인 (/login)
│   │   └── register/page.tsx       ✅ 회원가입 (/register)
│   │
│   ├── (protected)/                ✅ 로그인 필수 (proxy.ts → layout.tsx 이중 보호)
│   │   ├── layout.tsx              ✅
│   │   ├── checkout/page.tsx       ✅ 결제 (/checkout)
│   │   ├── mypage/page.tsx         ✅ 마이페이지 (/mypage)
│   │   └── order/page.tsx          ✅ 주문 내역 (/order)
│   │
│   ├── admin/                      ✅ 관리자 백오피스 (proxy.ts로 role: admin 보호)
│   │   ├── layout.tsx              ✅
│   │   └── page.tsx                ✅ 관리자 대시보드 (/admin)
│   │
│   └── api/                        Route Handlers
│       ├── auth/[...nextauth]/route.ts  ✅ NextAuth 자동 처리
│       ├── products/route.ts            ✅ 상품 목록/상세 API
│       ├── order/route.ts               ✅ 주문 API
│       └── admin/route.ts               ✅ 관리자 API
│
├── components/
│   ├── ui/                         ✅ Shadcn 자동 생성 전용 (수정 금지)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   └── layout/                     🔲 Header, Footer 등 전체 공통 레이아웃
│
├── features/                       도메인별 기능 모음
│   ├── auth/
│   │   ├── components/             🔲 로그인/회원가입 전용 UI 컴포넌트
│   │   └── auth.actions.ts         ✅ 회원가입 Server Action
│   ├── products/
│   │   ├── components/             🔲 상품 전용 UI 컴포넌트
│   │   └── products.actions.ts     🔲 상품 Server Actions
│   ├── order/
│   │   ├── components/             🔲 주문 전용 UI 컴포넌트
│   │   └── order.actions.ts        🔲 주문 Server Actions
│   └── admin/
│       ├── components/             🔲 관리자 전용 UI 컴포넌트
│       └── admin.actions.ts        🔲 관리자 Server Actions
│
├── hooks/                          🔲 공통 커스텀 훅
│
├── lib/
│   ├── utils.ts                    ✅ cn() 등 유틸리티 함수
│   └── queryKeys.ts                🔲 TanStack Query Key 중앙 관리
│
├── schemas/                        Zod 유효성 검사 스키마
│   ├── auth.schema.ts              ✅ 로그인/회원가입 검증
│   ├── order.schema.ts             ✅ 주문 폼 검증
│   └── product.schema.ts           ✅ 상품 등록 검증
│
└── types/
    └── next-auth.d.ts              ✅ NextAuth 세션 타입 확장
```

---

## 4. 핵심 파일별 역할

### 🔐 인증 & 인가 — 3개 파일 역할 분담

미들웨어(proxy.ts)는 Edge Runtime에서 실행되므로 Node.js 전용인 Prisma를 직접 사용할 수 없다. 이 제약 때문에 파일을 둘로 나눈다.

| 파일 | 실행 환경 | 역할 |
| --- | --- | --- |
| `src/auth.ts` | Node.js (서버) | NextAuth 핵심 설정. Prisma로 DB 조회, 비밀번호 검증, 세션 생성 |
| `src/auth.config.ts` | Edge + Node.js 공용 | proxy.ts와 공유하는 인가 설정. **Prisma import 절대 금지** |
| `src/proxy.ts` | Edge Runtime | 모든 요청 전에 실행. 로그인 여부·역할(role) 확인 후 리다이렉트. Next.js 16에서 `middleware.ts` 대체 |

### 🗄️ DB 클라이언트 — `packages/database/src/client.ts`

`packages/database`에서 Prisma Client를 싱글톤으로 생성하고 `apps/web`에서 `import`해서 사용한다. Next.js 핫 리로드 시 커넥션 풀 폭발을 방지하기 위해 `global` 객체에 인스턴스를 저장하는 표준 패턴을 사용한다.

### 🛒 클라이언트 상태 — Zustand (예정)

| 스토어 | 역할 |
| --- | --- |
| `cartStore.ts` | 장바구니 (add / remove / update / clear), localStorage 영속성 |
| `wishlistStore.ts` | 위시리스트(찜하기), localStorage 영속성 |
| `recentStore.ts` | 최근 본 상품 |

### ⚡ Query Key 중앙 관리 — `lib/queryKeys.ts` (예정)

TanStack Query는 Key로 캐시를 관리한다. Key가 컴포넌트에 흩어지면 `invalidateQueries` 호출 시 오타로 캐시가 갱신되지 않는 버그가 생긴다.

```ts
export const queryKeys = {
  products: {
    all: ['products'] as const,
    detail: (id: string) => ['products', id] as const,
    infinite: (params: object) => ['products', 'infinite', params] as const,
  },
  orders: {
    byUser: (userId: string) => ['orders', userId] as const,
    all: ['orders'] as const,
  },
  reviews: {
    byProduct: (productId: string) => ['reviews', productId] as const,
  },
}
```

---

## 5. 상태 관리 분류 원칙

새 기능을 만들 때 "이 데이터를 어디서 관리할까?"를 판단하는 기준이다.

| 상태 종류 | 관리 위치 | 예시 |
| --- | --- | --- |
| 서버 데이터 (읽기) | TanStack Query | 상품 목록, 주문 내역, 리뷰 |
| 클라이언트 전역 상태 | Zustand | 장바구니, 위시리스트, 최근 본 상품 |
| 폼 입력 상태 | React Hook Form | 배송지 입력, 로그인 폼, 상품 등록 |
| 컴포넌트 로컬 상태 | useState | 모달 열림/닫힘, 수량 선택 |

---

## 6. 라우트 보호 규칙

```
/                    → 누구나 접근 가능
/products/**         → 누구나 접근 가능
/cart                → 누구나 접근 가능
/search              → 누구나 접근 가능
/categories/**       → 누구나 접근 가능
/login, /register    → 누구나 접근 가능 (로그인 시 / 로 리다이렉트)
/checkout            → 로그인한 사용자만
/mypage              → 로그인한 사용자만
/order               → 로그인한 사용자만
/admin/**            → role: 'admin' 사용자만
```

이 규칙은 `src/proxy.ts`에서 `src/auth.config.ts`를 참조하여 적용된다.

---

## 7. 모노레포 아키텍처 분석

### 왜 모노레포인가

`packages/types`를 한 번만 수정하면 `apps/web`과 향후 추가될 `apps/mobile`에 동시에 반영된다. 멀티레포 방식은 타입 변경 시 저장소마다 따로 수정해야 하지만 모노레포는 단일 진실 공급원(SSOT)으로 이를 방지한다.

### pnpm의 역할

pnpm은 `node_modules/.pnpm` 가상 스토어에 패키지를 저장하고 각 패키지에는 심볼릭 링크만 생성한다. npm/yarn 대비 디스크 공간을 절약하고, `package.json`에 명시하지 않은 패키지는 접근 불가하여 유령 의존성(Phantom Dependency)을 원천 차단한다.

### 장단점 요약

| | 내용 |
|---|---|
| ✅ 코드 재사용 | 타입, DB 로직을 한 번만 작성하고 모든 앱에서 공유 |
| ✅ 의존성 일관성 | 단일 `pnpm-lock.yaml`로 전체 버전 통제 |
| ✅ 타입 안전성 | Prisma 타입이 즉시 UI까지 전파되어 버그 조기 발견 |
| ⚠️ 초기 학습 곡선 | 워크스페이스, 심볼릭 링크 개념이 생소할 수 있음 |
| ⚠️ 빌드 복잡도 | 규모 확장 시 Turborepo 도입으로 해결 가능 |
