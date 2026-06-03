# Next.js 16 변경점 & 프로젝트 준수 현황

> 이 문서는 Next.js 15 → 16 주요 변경점을 정리하고,  
> 현재 프로젝트(`apps/web`)가 각 규칙을 따르는지 점검한다.  
> 공식 업그레이드 가이드: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`

---

## 1. Async Request APIs (Breaking)

### 변경 내용

Next.js 15에서 경고만 표시하던 동기 접근이 **16에서 완전히 제거**됐다.  
아래 API는 반드시 `await` 또는 `React.use()`로 unwrap해야 한다.

| API | 적용 위치 |
|---|---|
| `params` | `page.tsx`, `layout.tsx`, `route.ts`, `default.tsx` |
| `searchParams` | `page.tsx` |
| `cookies()` | 서버 컴포넌트 / Server Action |
| `headers()` | 서버 컴포넌트 / Server Action |
| `draftMode()` | 서버 컴포넌트 |

**올바른 패턴:**

```tsx
// page.tsx - params
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// page.tsx - searchParams
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
}

// 서버 컴포넌트 - cookies
import { cookies } from 'next/headers';
const cookieStore = await cookies();
```

### 프로젝트 준수 현황

| 파일 | 대상 | 상태 |
|---|---|---|
| `app/(shop)/products/[id]/page.tsx` | `params` | ✅ `Promise<{id}>` + `await` |
| `app/(shop)/categories/[slug]/page.tsx` | `params` | ✅ `Promise<{slug}>` + `await` |
| `app/(shop)/products/page.tsx` | `searchParams` | ✅ `Promise<{...}>` + `await` |
| `cookies()` / `headers()` / `draftMode()` | — | ✅ 미사용 |

> **주의**: 향후 `cookies()`나 `headers()`를 추가할 때 반드시 `await`를 붙인다.

---

## 2. Turbopack 기본 적용

### 변경 내용

`next dev`, `next build` 모두 Turbopack이 기본값이 됐다.  
`--turbopack` 플래그 없이도 자동 적용된다.

**`next.config.ts`에서 상위 레벨로 이동:**

```ts
// ❌ Next.js 15 방식
experimental: { turbopack: { ... } }

// ✅ Next.js 16 방식
turbopack: { ... }   // 최상위 옵션
```

### 프로젝트 준수 현황

| 항목 | 상태 |
|---|---|
| `experimental.turbopack` 사용 여부 | ✅ 미사용 (기본값 사용) |
| webpack 커스텀 설정 충돌 여부 | ✅ 없음 |

---

## 3. Caching APIs 변경

### 변경 내용

#### `revalidateTag` — 두 번째 인자 필수

```ts
// ❌ Next.js 15 (deprecated)
revalidateTag('products')

// ✅ Next.js 16
revalidateTag('products', 'max')   // cacheLife 프로필 필요
```

#### `unstable_cacheLife` / `unstable_cacheTag` → stable

```ts
// ❌ Before
import { unstable_cacheLife as cacheLife } from 'next/cache'

// ✅ After
import { cacheLife } from 'next/cache'
```

### 프로젝트 준수 현황

| 항목 | 상태 |
|---|---|
| `revalidateTag` 사용 여부 | ✅ 미사용 |
| `unstable_cacheLife` / `unstable_cacheTag` 사용 여부 | ✅ 미사용 |

> **주의**: 향후 `revalidateTag`를 추가할 때 두 번째 인자(예: `'max'`, `'days'`)를 반드시 넣는다.

---

## 4. `next/image` 변경 (Breaking)

### 변경 내용

| 항목 | 이전 (v15) | 이후 (v16) |
|---|---|---|
| `minimumCacheTTL` 기본값 | 60초 | 14400초 (4시간) |
| `imageSizes` 기본값 | `[16, 32, 48, ...]` | `[32, 48, ...]` (16 제거) |
| `qualities` 기본값 | 모든 품질 허용 | `[75]`만 허용 |
| 로컬 IP 최적화 | 허용 | 차단 (보안) |
| 최대 리다이렉트 횟수 | 무제한 | 3회 |
| `images.domains` | 사용 가능 | ⚠️ deprecated → `remotePatterns` 사용 |
| `next/legacy/image` | 사용 가능 | ⚠️ deprecated → `next/image` 사용 |

### 프로젝트 준수 현황

| 항목 | 상태 | 비고 |
|---|---|---|
| `next/image` 사용 여부 | — | 미사용. `<img>` 태그 직접 사용 (`ProductImage.tsx`) |
| `images.domains` 사용 여부 | ✅ 미사용 | |
| `next/legacy/image` 사용 여부 | ✅ 미사용 | |

> **참고**: 현재 `ProductImage.tsx`는 `<img>` 태그를 직접 사용한다.  
> 향후 외부 이미지를 최적화해야 한다면 `next/image` + `remotePatterns` 조합을 사용한다.

---

## 5. Parallel Routes — `default.js` 필수 (Breaking)

### 변경 내용

`@slot` 폴더(병렬 라우트)가 있으면 반드시 `default.tsx`가 있어야 한다.  
없으면 빌드가 실패한다.

```tsx
// app/@modal/default.tsx — 필수
export default function Default() {
  return null;
}
```

### 프로젝트 준수 현황

| 항목 | 상태 |
|---|---|
| 병렬 라우트(`@slot`) 사용 여부 | ✅ 미사용 |

> **주의**: 향후 모달 등 병렬 라우트를 추가하면 반드시 `default.tsx`를 함께 만든다.

---

## 6. `middleware` → `proxy` 이름 변경

### 변경 내용

`middleware.ts` 파일명과 `export function middleware`가 deprecated됐다.

```ts
// ❌ deprecated
// middleware.ts
export function middleware(request: Request) {}

// ✅ Next.js 16
// proxy.ts
export function proxy(request: Request) {}
```

관련 설정 키도 변경됐다.

```ts
// ❌ Before
skipMiddlewareUrlNormalize: true

// ✅ After
skipProxyUrlNormalize: true
```

### 프로젝트 준수 현황

| 파일 | 상태 |
|---|---|
| `proxy.ts` 사용 여부 | ✅ 이미 `proxy.ts`로 작성됨 |

---

## 7. 제거된 기능

현재 프로젝트에서 사용하지 않으므로 참고만 한다.

| 제거 항목 | 대안 |
|---|---|
| AMP 지원 | 해당 없음 |
| `next lint` 명령어 | ESLint CLI 직접 사용 |
| `serverRuntimeConfig` / `publicRuntimeConfig` | 환경변수 (`process.env`) |
| `experimental.dynamicIO` | `cacheComponents: true` |
| `unstable_rootParams` | 향후 대안 API 예정 |
| `devIndicators.appIsrStatus` 등 옵션 | 지표 자체는 유지됨 |

---

## 점검 요약

| 카테고리 | 준수 | 미준수 | 해당 없음 |
|---|---|---|---|
| Async Request APIs (`params`, `searchParams`) | ✅ 3개 파일 | — | — |
| `cookies()` / `headers()` 비동기 접근 | — | — | ✅ 미사용 |
| Turbopack 설정 | ✅ | — | — |
| `revalidateTag` 두 번째 인자 | — | — | ✅ 미사용 |
| `next/image` 변경 대응 | — | — | ✅ 미사용 |
| 병렬 라우트 `default.tsx` | — | — | ✅ 미사용 |
| `proxy.ts` 네이밍 | ✅ | — | — |

**결론**: 현재 사용 중인 API는 모두 Next.js 16 규칙을 준수하고 있다.  
향후 새 기능을 추가할 때 위 "주의" 항목을 참고한다.
