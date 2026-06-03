# 프로젝트 폴더 구조와 역할

이 문서는 `apps/web/src/` 아래의 폴더 구조가 왜 이렇게 구성되었는지를 설명한다.
각 폴더의 역할과 설계 이유를 이해하면 새로운 기능을 어디에 추가해야 할지 판단할 수 있다.

---

## 전체 구조 한눈에 보기

```
src/
├── app/                        ← Next.js 라우팅 전담 (URL 구조)
│   ├── (auth)/                 ← 로그인/회원가입 전용 레이아웃 그룹
│   ├── (shop)/                 ← 쇼핑몰 공통 레이아웃 그룹 (헤더/푸터)
│   ├── (protected)/            ← 로그인 필수 페이지 그룹
│   ├── admin/                  ← 관리자 페이지
│   └── api/                    ← 서버 API 엔드포인트
│
├── features/                   ← 도메인별 클라이언트 컴포넌트
│   ├── auth/components/
│   ├── products/components/
│   ├── order/components/
│   └── admin/components/
│
├── components/
│   ├── layout/                 ← 전체 공통 레이아웃 컴포넌트 (Header, Footer 등)
│   └── ui/                     ← Shadcn 프리미티브 전용
│
├── store/                      ← Zustand 전역 상태
├── schemas/                    ← Zod 유효성 검사 스키마
├── lib/                        ← 유틸리티 함수
├── types/                      ← TypeScript 타입 확장
│
├── auth.ts                     ← NextAuth 핵심 설정
├── auth.config.ts              ← NextAuth 공유 설정
└── proxy.ts                    ← 미들웨어 (라우트 보호)
```

---

## 1. app/ — 라우팅 전담

`app/` 폴더의 유일한 역할은 **URL 구조를 정의하는 것**이다.
폴더 이름이 곧 URL 세그먼트가 되고, 각 폴더 안의 `page.tsx` 가 해당 URL의 화면이 된다.

```
app/(shop)/products/page.tsx  →  /products
app/(shop)/products/[id]/page.tsx  →  /products/123
app/(auth)/login/page.tsx  →  /login
```

`page.tsx` 는 원칙적으로 **서버 컴포넌트**로 유지한다.
실제 상호작용이 필요한 UI는 `features/` 의 클라이언트 컴포넌트에 위임한다.

> **왜 features/ 를 app/ 안에 넣지 않는가?**
> Next.js는 프로젝트 구조에 대해 강요하지 않는다(unopinionated).
> `app/` 바깥에 `features/` 를 두는 방식은 Next.js 공식 문서가 명시적으로 소개하는 전략 중 하나다.
> `app/` 은 라우팅, `features/` 는 기능 컴포넌트로 역할을 명확히 분리하면
> 파일 수가 많아져도 구조 파악이 쉽다.

---

## 2. app/ 안의 Route Group — (괄호) 폴더

`(괄호)` 로 감싼 폴더는 **URL에 나타나지 않는다.**
역할은 두 가지다.

1. **레이아웃 분리** — 그룹마다 다른 `layout.tsx` 적용
2. **논리적 그룹화** — 관련 페이지를 한곳에 모아 관리

```
app/
├── (auth)/layout.tsx     ← 가운데 정렬만 (헤더 없음)
├── (shop)/layout.tsx     ← Header + Footer 포함
└── (protected)/layout.tsx ← 세션 검증 후 Header + Footer
```

### 레이아웃 적용 범위

모든 페이지는 `app/layout.tsx` (루트 레이아웃) 를 기본으로 받고,
자신이 속한 Route Group 의 `layout.tsx` 를 추가로 받는다.

```
/login 요청 시 적용되는 레이아웃:
  RootLayout (app/layout.tsx)         ← html, body, 폰트, Providers
  └── AuthLayout ((auth)/layout.tsx)  ← 가운데 정렬
      └── LoginPage

/products 요청 시 적용되는 레이아웃:
  RootLayout (app/layout.tsx)         ← html, body, 폰트, Providers
  └── ShopLayout ((shop)/layout.tsx)  ← Header + Footer
      └── ProductsPage
```

### (auth) — 로그인 / 회원가입 전용

헤더·푸터 없이 화면 가운데 정렬만 적용한다.
로그인, 회원가입 페이지가 여기에 속한다.

### (shop) — 쇼핑몰 공통

Header 와 Footer 가 포함된 레이아웃을 적용한다.
상품 목록, 상품 상세, 장바구니, 검색, 카테고리 페이지가 여기에 속한다.

### (protected) — 로그인 필수 페이지

`layout.tsx` 에서 서버 컴포넌트로 세션을 직접 검증한다.
세션이 없으면 `/login` 으로 즉시 redirect 한다.

```tsx
// (protected)/layout.tsx
const session = await auth();
if (!session) redirect('/login');
```

미들웨어(`proxy.ts`)에서 1차 검증을 하지만 우회 가능성이 있다.
서버 컴포넌트에서 2차 검증을 함으로써 보안을 이중으로 보장한다.

주문 내역, 마이페이지, 결제 페이지가 여기에 속한다.

---

## 3. app/api/ — 서버 API 엔드포인트

`app/` 하위의 폴더 중 `page.tsx` 대신 `route.ts` 가 있으면 API 엔드포인트로 동작한다.
`app/api/` 는 Next.js가 강제하는 규칙이 아니라 **API 파일을 한곳에 모아 관리하기 위한 관례**다.

```
app/api/
├── products/route.ts          ← GET /api/products
├── order/route.ts             ← POST /api/order
├── admin/route.ts             ← GET/POST /api/admin
└── auth/[...nextauth]/route.ts ← NextAuth 인증 처리
```

`[...nextauth]` 는 `/api/auth/` 이하의 모든 경로를 NextAuth 가 처리하도록 위임하는 catch-all 라우트다.
NextAuth 가 내부적으로 `/api/auth/signin`, `/api/auth/callback` 등 여러 엔드포인트를 필요로 하기 때문이다.

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;  // auth.ts의 handlers를 re-export
```

---

## 4. features/ — 도메인별 클라이언트 컴포넌트

`app/` 의 `page.tsx` 가 서버 컴포넌트로 유지되기 위해,
상호작용이 필요한 UI는 여기에 클라이언트 컴포넌트로 분리한다.

```
features/
├── auth/components/
│   ├── LoginForm.tsx      ← "use client" — useForm, signIn, useRouter
│   └── RegisterForm.tsx   ← "use client" — useForm, useRouter
├── products/components/
├── order/components/
└── admin/components/
```

**왜 (shop) 그룹을 따라 shop/ 폴더를 만들지 않는가?**

`(shop)` 은 레이아웃을 공유하기 위한 라우팅 그룹이고 URL에도 나타나지 않는다.
`features/` 는 라우팅 구조가 아닌 **도메인(기능) 단위**로 분류한다.
`products`, `order` 가 실제 도메인이므로 `(shop)` 이라는 레이아웃 그룹을 따라갈 이유가 없다.

---

## 5. components/ — 공통 컴포넌트

### components/layout/

Header, Footer, SearchBar, CartIcon 등 **앱 전체에서 공통으로 사용하는 레이아웃 컴포넌트**다.
특정 도메인에 종속되지 않는 컴포넌트가 여기에 위치한다.

### components/ui/

Shadcn UI 가 자동 생성하는 프리미티브 컴포넌트 전용 폴더다.
`Button`, `Input`, `Label` 등이 여기에 있다.
**직접 커스텀 컴포넌트를 작성하는 곳이 아니다.** 커스텀 컴포넌트는 반드시 `features/` 에 작성한다.

---

## 6. store/ — Zustand 전역 상태

클라이언트 사이드 전역 상태를 관리한다.

```
store/
├── cartStore.ts     ← 장바구니 상태 (상품 추가/삭제/수량 변경)
└── recentStore.ts   ← 최근 본 상품 상태
```

DB의 Cart/CartItem 모델은 현재 미사용이며, 장바구니는 Zustand 로만 관리한다.

---

## 7. schemas/ — Zod 유효성 검사

사용자 입력값 검증 스키마를 정의한다.
React Hook Form 과 연결해 폼 유효성 검사에 사용하고, API Route 에서 요청 데이터 검증에도 사용한다.

```
schemas/
├── auth.schema.ts     ← 로그인, 회원가입 폼 검증
├── order.schema.ts    ← 주문 폼 검증
└── product.schema.ts  ← 상품 등록/수정 폼 검증
```

---

## 8. lib/ — 유틸리티

특정 도메인에 종속되지 않는 순수 유틸리티 함수를 둔다.

```
lib/
├── utils.ts       ← cn() 등 Tailwind 클래스 병합 유틸리티
└── queryKeys.ts   ← TanStack Query 캐시 키 중앙 관리
```

---

## 9. types/ — TypeScript 타입 확장

라이브러리의 기본 타입을 이 프로젝트에 맞게 확장하는 파일을 둔다.

```
types/
└── next-auth.d.ts  ← NextAuth Session, User 타입에 id, role 필드 추가
```

`declare module` 은 기존 라이브러리 타입을 덮어쓰지 않고 확장하는 TypeScript 문법이다.
이 파일이 없으면 `session.user.id`, `session.user.role` 사용 시 TypeScript 오류가 발생한다.

---

## 10. src/ 루트 파일 — 앱 전체 설정

특정 도메인에 종속되지 않고 앱 전체에 걸쳐 사용되는 설정 파일이다.
`features/` 나 `app/` 하위가 아닌 `src/` 루트에 위치한다.

```
src/
├── auth.ts         ← NextAuth 핵심 설정 (handlers, auth, signIn, signOut 내보냄)
├── auth.config.ts  ← auth.ts와 proxy.ts가 공유하는 NextAuth 공통 설정
└── proxy.ts        ← 미들웨어 — 라우트 접근 전 세션 1차 검증
```

`auth.ts` 가 내보내는 `handlers` 는 `app/api/auth/[...nextauth]/route.ts` 에서 re-export 되고,
`auth` 함수는 서버 컴포넌트와 Server Action 어디서든 `import { auth } from "@/auth"` 로 참조한다.
