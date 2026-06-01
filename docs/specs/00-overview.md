# 구현 로드맵 — 쇼핑몰 바이브코딩

**기준 문서**: `docs/PRD.md` v3.0
**최종 수정**: 2026-05-31

---

## 구현 순서

각 스펙은 아래 순서대로 구현한다. 이전 스펙이 완료된 후 다음 스펙으로 넘어간다.

| # | 스펙 파일 | 핵심 내용 | 상태 |
|---|---|---|---|
| 01 | `01-layout.md` | Header, Footer, TanStack Query Provider 설정 | ✅ |
| 01-1 | `01-1-homepage-design.md` | 홈 페이지 디자인 (네이버 쇼핑 레이아웃) | ✅ |
| 01-2 | `01-2-category-strategy.md` | 카테고리 테이블, 대/중카테고리, 큐레이션 분리 | 🔲 |
| 02 | `02-products.md` | 상품 목록(무한 스크롤), 상품 상세, API Route | 🔲 |
| 03 | `03-cart.md` | Zustand 장바구니 스토어, 장바구니 페이지 | 🔲 |
| 04 | `04-checkout.md` | 주문/결제 폼, Server Action, DB 트랜잭션 | 🔲 |
| 05 | `05-mypage.md` | 주문 내역, 주문 취소, 리뷰 작성 진입점 | 🔲 |
| 06 | `06-admin.md` | 상품 CRUD, 주문 상태 변경, 대시보드 | 🔲 |
| 07 | `07-search.md` | 키워드 검색, 검색 결과 페이지 | 🔲 |
| 08 | `08-wishlist.md` | 위시리스트·최근 본 상품 Zustand 스토어 | 🔲 |
| 09 | `09-reviews.md` | 리뷰 & 별점 DB 스키마, API, 컴포넌트 | 🔲 |
| 10 | `10-oauth.md` | Google 소셜 로그인 (NextAuth OAuth) | 🔲 |

---

## 현재 완료된 것

| 항목 | 상태 |
|---|---|
| 모노레포 구조 (pnpm workspace) | ✅ |
| DB 스키마 + 마이그레이션 | ✅ |
| `packages/database` Prisma 클라이언트 | ✅ |
| `packages/types` 공유 인터페이스 | ✅ |
| NextAuth 설정 (auth.ts, auth.config.ts, proxy.ts) | ✅ |
| 로그인 / 회원가입 페이지 + Server Action | ✅ |
| 라우트 그룹 구조 (shop, auth, protected, admin) | ✅ |
| Zod 스키마 (auth, order, product) | ✅ |
| Shadcn 컴포넌트 (button, input, label) | ✅ |
| 기본 API Route 파일 (products, order, admin, auth) | ✅ |

---

## DB 스키마 현황 및 추가 필요 항목

**현재 스키마**: User, Product, SystemCode, Order, OrderItem, Cart, CartItem

**추가 필요**: Review 모델 (스펙 09에서 추가)

> **Cart/CartItem 모델 관련 결정**
> DB에 Cart/CartItem 모델이 있지만 PRD 기준으로 장바구니는 **Zustand(클라이언트)**로 관리한다.
> DB의 Cart 모델은 향후 서버 사이드 장바구니 동기화가 필요할 때를 위해 스키마는 유지하되 현재는 사용하지 않는다.

---

## 패키지 설치 규칙 — pnpm 모노레포에서 반드시 지켜야 할 것

### 왜 npm install을 쓰면 안 되는가

pnpm 모노레포에서 `npm install <패키지>`를 사용하면 동작은 하지만 두 가지 문제가 생긴다.

1. **package-lock.json 충돌**: `npm install`은 `package-lock.json`을 생성/수정한다. 이 파일이 pnpm의 `pnpm-lock.yaml`과 공존하면 어떤 잠금 파일이 기준인지 불분명해져 팀원 간 설치 결과가 달라질 수 있다.

2. **이중 설치 낭비**: `npm install`이 `node_modules`에 패키지를 설치하고, 이후 `pnpm install`이 같은 패키지를 다시 pnpm 방식(가상 스토어 + 심링크)으로 재설치한다.

### 올바른 설치 방법

```bash
# 방법 1 — 해당 앱 디렉토리에서 직접
cd apps/web
pnpm add @tanstack/react-query

# 방법 2 — 루트에서 필터 사용 (동일한 결과)
pnpm --filter web add @tanstack/react-query
```

두 방법 모두 `apps/web/package.json`에 의존성이 추가되고 루트 `pnpm-lock.yaml`만 업데이트된다.

### 이미 package-lock.json이 있다면

`apps/web/package-lock.json`이 존재하면 이전에 npm이 혼용된 흔적이다. 삭제해도 된다.
pnpm은 `pnpm-lock.yaml`만 사용하며 `package-lock.json`은 무시한다.

---

## 스펙 문서 형식

각 스펙은 아래 구조를 따른다.

```
## 목표
## 완료 기준
## DB 스키마 변경 (필요시)
## 생성/수정할 파일
## 구현 순서
## 핵심 코드 패턴
```
