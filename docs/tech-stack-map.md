# 기술 스택 × 쇼핑몰 기능 매핑

| 기술 | 사용된 기능 | 주요 파일 |
|---|---|---|
| **Next.js 16 App Router** | 전체 라우팅, API Route, Server Component, Server Action, proxy(미들웨어) | `src/app/**`, `src/proxy.ts` |
| **React 19** | 모든 UI 컴포넌트 | `src/components/**`, `src/features/**` |
| **Prisma 7** | DB 스키마 정의, ORM 쿼리 (상품·주문·유저·채팅) | `packages/database/prisma/schema.prisma`, `packages/database/src/client.ts` |
| **PostgreSQL (`pg`)** | Prisma Adapter 백엔드 DB 드라이버 | `packages/database/prisma/migrations/**` |
| **NextAuth.js (Auth.js v5)** | 로그인·회원가입·세션·관리자 권한 인가 | `src/auth.ts`, `src/auth.config.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| **Redis (`ioredis`)** | 비로그인 장바구니 저장, 채팅 메시지 Pub/Sub 중계 | `src/lib/redis.ts`, `src/lib/cart.ts`, `src/lib/redisPubSub.ts` |
| **WebSocket (`ws`)** | 상담원 채팅 실시간 통신 서버 | `apps/web/server.ts`, `src/lib/websocket.ts` |
| **Zustand** | 최근 본 상품 클라이언트 전역 상태 | `src/store/recentStore.ts` |
| **TailwindCSS 4** | 전체 UI 스타일링 | 모든 컴포넌트 |
| **Shadcn UI** | 공통 UI 컴포넌트 (Button·Input·Label) | `src/components/ui/**` |
| **React Hook Form** | 로그인·회원가입·주문·관리자 상품 등록 폼 | `src/features/auth/components/LoginForm.tsx`, `RegisterForm.tsx`, `src/features/order/components/CheckoutForm.tsx`, `src/features/admin/components/ProductForm.tsx` |
| **Zod** | 폼 입력 유효성 스키마 정의 | `src/schemas/auth.schema.ts`, `order.schema.ts`, `product.schema.ts` |
| **@hookform/resolvers** | React Hook Form + Zod 연결 | 위 폼 파일들 |
| **TanStack Query** | 서버 데이터 캐싱 Provider 설정, Query Key 중앙 관리 | `src/components/layout/Providers.tsx`, `src/lib/queryKeys.ts` |
| **bcryptjs** | 회원가입 시 비밀번호 해시 | `src/features/auth/auth.actions.ts` |
| **lucide-react** | 헤더 아이콘 (장바구니·검색·마이쇼핑) | `src/components/layout/Header.tsx`, `src/components/layout/CartIcon.tsx` |
