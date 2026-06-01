# 스펙 01 — 공통 레이아웃 & Provider 설정

## 왜 레이아웃과 Provider를 함께 설정하는가

두 작업 모두 **모든 페이지가 공통으로 의존하는 인프라**를 설치하는 작업이다.
그리고 둘 다 수정하는 파일이 `src/app/layout.tsx`로 같다.

TanStack Query는 데이터를 캐싱하는 `QueryClient`를 앱 전체에 공유해야 한다.
이를 위해 모든 페이지를 감싸는 `<QueryClientProvider>`를 루트 레이아웃에 추가해야 한다.

그런데 루트 `layout.tsx`는 서버 컴포넌트다.
`QueryClientProvider`는 `useState`를 사용하므로 클라이언트 컴포넌트(`'use client'`)에서만 동작한다.
따라서 `Providers.tsx`라는 클라이언트 래퍼를 별도로 만들고 루트 레이아웃에 끼워 넣어야 한다.

이 `Providers.tsx`는 본질적으로 **레이아웃의 일부**다.
Header와 Footer도 같은 이유로 레이아웃 파일들을 건드린다.
두 작업을 분리하면 같은 파일을 두 번 수정해야 하므로 한 스펙에 묶는다.

---

## 목표
Header, Footer 공통 컴포넌트를 만들고 TanStack Query Provider를 설정한다.
모든 페이지의 기반이 되는 레이아웃을 완성한다.

## 완료 기준
- 모든 (shop) 페이지에 Header와 Footer가 표시된다
- TanStack Query를 어느 컴포넌트에서든 사용할 수 있다
- Header에 로그인 상태에 따라 다른 메뉴가 표시된다

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/components/layout/Header.tsx` | 생성 |
| `src/components/layout/Footer.tsx` | 생성 |
| `src/components/layout/Providers.tsx` | 생성 — TanStack Query Provider |
| `src/app/layout.tsx` | 수정 — Providers 적용 |
| `src/app/(shop)/layout.tsx` | 수정 — Header, Footer 적용 |

---

## 구현 순서

### 1. Providers.tsx 생성

TanStack Query는 클라이언트 컴포넌트에서만 초기화할 수 있다.
루트 layout.tsx는 서버 컴포넌트이므로 별도 파일로 분리한다.

```tsx
// src/components/layout/Providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,   // 1분간 캐시 유지
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 2. 루트 layout.tsx에 Providers 적용

```tsx
// src/app/layout.tsx
import Providers from '@/components/layout/Providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 3. Header.tsx 생성

```tsx
// src/components/layout/Header.tsx
import { auth } from '@/auth';
import { signOut } from '@/auth';

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="text-lg font-bold text-foreground">ShopApp</a>
        <nav className="flex items-center gap-4">
          <a href="/products" className="text-sm text-muted-foreground hover:text-foreground">상품</a>
          <a href="/cart" className="text-sm text-muted-foreground hover:text-foreground">장바구니</a>
          {session ? (
            <>
              <a href="/mypage" className="text-sm text-muted-foreground hover:text-foreground">마이페이지</a>
              {session.user.role === 'admin' && (
                <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground">관리자</a>
              )}
              <form action={async () => { 'use server'; await signOut(); }}>
                <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">로그아웃</button>
              </form>
            </>
          ) : (
            <a href="/login" className="text-sm text-muted-foreground hover:text-foreground">로그인</a>
          )}
        </nav>
      </div>
    </header>
  );
}
```

### 4. Footer.tsx 생성

```tsx
// src/components/layout/Footer.tsx
export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
        <p className="text-sm text-muted-foreground">© 2026 ShopApp</p>
      </div>
    </footer>
  );
}
```

### 5. (shop)/layout.tsx에 Header, Footer 적용

```tsx
// src/app/(shop)/layout.tsx
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

---

## 패키지 설치

```bash
# apps/web 디렉토리에서 실행
pnpm add @tanstack/react-query
```
