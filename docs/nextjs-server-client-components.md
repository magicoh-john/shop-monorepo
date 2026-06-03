# Next.js App Router — 서버 컴포넌트와 클라이언트 컴포넌트 원리

이 문서는 사용자가 `localhost:3000/login` 을 요청했을 때 실제로 어떤 일이 일어나는지를 출발점으로 삼아, Next.js App Router가 서버 컴포넌트와 클라이언트 컴포넌트를 나눠 작성하는 이유와 원리를 설명한다.

---

## 1. 라우트 매핑 — 어떻게 page.tsx를 찾는가

세그먼트(segment)는 URL을 `/` 로 나눈 각각의 조각이다.

```
/products/123/review
   ↑        ↑    ↑
 세그먼트1  세그먼트2  세그먼트3
```

`/login` 은 세그먼트가 하나인 경우다.

```
/login
  ↑
세그먼트1
```

Next.js는 `app/` 폴더의 **폴더 이름을 URL 세그먼트로 매핑**한다.
단, `(괄호)` 로 감싼 폴더(Route Group)는 URL에서 무시된다.

```
URL: /login

app/
└── (auth)/          ← 무시 (URL에 포함 안 됨)
    └── login/       ← "login" 세그먼트 매칭 ✅
        └── page.tsx ← 이 파일을 실행
```

매칭된 파일들로 **컴포넌트 트리**가 구성된다.

Route Group `(괄호)` 폴더는 레이아웃을 분리하는 역할도 한다.
헤더/푸터가 있는 쇼핑몰 레이아웃과 로그인/회원가입 전용 레이아웃을 별도로 관리할 수 있다.

```
app/
├── layout.tsx          ← 루트 레이아웃 (html, body, Providers — 모든 페이지 공통)
├── (auth)/
│   ├── layout.tsx      ← 가운데 정렬만 (헤더 없음)
│   ├── login/page.tsx  ← /login → (auth) 레이아웃만 적용
│   └── register/page.tsx
└── (shop)/
    ├── layout.tsx      ← 헤더, 푸터 포함
    └── products/       ← /products → (shop) 레이아웃만 적용
```

`/login` 은 `app/layout.tsx` + `(auth)/layout.tsx` 만 적용받는다.
`(shop)/layout.tsx` 의 헤더·푸터는 적용되지 않는다.

```
RootLayout (app/layout.tsx)
└── AuthLayout ((auth)/layout.tsx)   ← 가운데 정렬
    └── LoginPage
        └── LoginForm
```

`/products` 등 `(shop)` 하위 페이지는 `app/layout.tsx` + `(shop)/layout.tsx` 두 개의 영향을 받는다.
루트 레이아웃의 폰트·Providers가 적용된 위에 Header와 Footer가 추가된다.

```
RootLayout (app/layout.tsx)
└── ShopLayout ((shop)/layout.tsx)   ← Header + Footer
    └── ProductsPage
```

> **중요**: 브라우저가 직접 이 경로를 탐색하는 것이 아니다.
> 브라우저는 서버로 HTTP GET `/login` 을 보낼 뿐이고,
> 서버의 Next.js가 위 규칙에 따라 파일을 찾아 실행한다.

---

## 2. 전체 요청 흐름

사용자가 `localhost:3000/login` 을 브라우저 주소창에 입력하면 아래 순서로 진행된다.

```
브라우저                       Next.js 서버
   │                               │
   │  HTTP GET /login ─────────────▶│
   │                               │  ① 라우트 매핑 (page.tsx 탐색)
   │                               │  ② 컴포넌트 트리 구성
   │                               │  ③ 서버 컴포넌트 + 클라이언트 컴포넌트
   │                               │     → 합쳐서 정적 HTML 생성
   │  ◀──────────── HTML 전송 ──────│
   │                               │
   │  화면 표시 (이벤트 없는 껍데기) │
   │                               │
   │  HTTP GET /_next/static/...    │
   │  (JS 번들 자동 요청) ──────────▶│
   │  ◀──────────── JS 번들 전송 ───│
   │                               │
   │  Hydration → 이벤트 활성화     │
   │  (온전한 로그인 페이지 완성)    │
```

**핵심 흐름 요약**:
> 서버 + 클라이언트 컴포넌트가 합쳐져서 최소한의 정적인 HTML을 만들어 사용자에게 먼저 내려보내고,
> 사용자가 받아서 화면에 로그인 페이지를 빠르게 그린다.
> 그 이후 서버에 클라이언트 JS를 요청하고 받아서 Hydration이 발생하여 온전한 로그인 페이지가 완성된다.

---

## 3. 서버 컴포넌트 vs 클라이언트 컴포넌트

### 왜 나누는가

기존 React(SPA)는 **모든 컴포넌트의 JS를 브라우저로 전송**했다.
`useState`, 이벤트 핸들러가 필요 없는 단순 레이아웃도 JS로 내려갔기 때문에
JS 번들이 커지고 초기 로딩이 느렸다.

Next.js App Router는 이를 해결하기 위해 **"이 컴포넌트에 브라우저 기능이 필요한가?"** 를 기준으로 분리한다.

| 구분 | 서버 컴포넌트 | 클라이언트 컴포넌트 |
|---|---|---|
| 선언 | 기본값 (선언 없음) | 파일 맨 위에 `"use client"` |
| 실행 위치 | 서버에서만 | 서버(초기 HTML 생성) + 브라우저(hydration) |
| 브라우저로 JS 전송 | ❌ 없음 | ✅ 있음 |
| 사용 가능 | DB 접근, 환경변수, async/await | useState, useEffect, onClick, useRouter |
| 사용 불가 | onClick, useState, useRouter 등 | 직접 DB 접근 |

### "use client"는 CSR이 아니다

**`"use client"`가 있어도 초기 HTML은 서버에서 만들어진다.**

`"use client"`의 의미는 **"이 컴포넌트의 JS를 브라우저에도 보내라"** 는 뜻이지,
서버 렌더링을 건너뛰라는 뜻이 아니다.

```
register/page.tsx ("use client") 요청 흐름:

1. 서버에서 RegisterPage 실행 → <input>, <button> HTML 생성
2. HTML → 브라우저 전송 → 화면 표시 (버튼 클릭 안 됨)
3. JS 번들 → 브라우저 전송 → Hydration → useForm, onClick 활성화
```

---

## 4. 실제 코드 — 로그인 페이지

### login/page.tsx — 서버 컴포넌트 (카드 래퍼)

```tsx
// "use client" 없음 → 서버 컴포넌트
import LoginForm from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="bg-card text-card-foreground rounded-[var(--radius)] border border-border shadow-sm p-6 w-full max-w-sm space-y-4">
      <LoginForm />
    </div>
  );
}
```

`LoginPage`는 `LoginForm`을 감싸는 카드 모양의 흰 박스 컨테이너다.
`onClick`도, `useState`도 없다.
서버에서 HTML 문자열로 변환된 후 **JS는 전혀 브라우저로 전송되지 않는다.**

### features/auth/components/LoginForm.tsx — 클라이언트 컴포넌트

```tsx
"use client";  // ← 이 한 줄이 클라이언트 컴포넌트로 지정

import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const result = await signIn("credentials", { ...data, redirect: false });
    if (result?.error) return alert("로그인 실패...");
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <h1>로그인</h1>
      <Input {...register("email")} type="email" />
      <Input {...register("password")} type="password" />
      <Button onClick={handleSubmit(onSubmit)}>로그인</Button>
    </>
  );
}
```

`useForm`, `useRouter`, `onClick` — 모두 **브라우저에서만 동작하는 기능**이다.
이 파일의 JS가 브라우저로 전송되어 Hydration 후 동작한다.

---

## 5. 실제 코드 — 회원가입 페이지

로그인 페이지와 동일한 패턴으로 분리한다.

### register/page.tsx — 서버 컴포넌트 (카드 래퍼)

```tsx
// "use client" 없음 → 서버 컴포넌트
import RegisterForm from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="bg-card text-card-foreground rounded-[var(--radius)] border border-border shadow-sm p-6 w-full max-w-sm space-y-4">
      <RegisterForm />
    </div>
  );
}
```

### features/auth/components/RegisterForm.tsx — 클라이언트 컴포넌트

```tsx
"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { register } from "@/features/auth/auth.actions";

export default function RegisterForm() {
  const router = useRouter();
  const { register: formRegister, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("name", data.name);

    const result = await register(formData);
    if (result?.error) return alert(result.error);

    alert("회원가입 완료! 로그인 페이지로 이동합니다.");
    router.push("/login");
  };

  return (
    <>
      <h1>회원가입</h1>
      <Input {...formRegister("name")} placeholder="홍길동" />
      <Input {...formRegister("email")} type="email" />
      <Input {...formRegister("password")} type="password" />
      <Button onClick={handleSubmit(onSubmit)}>
        {isSubmitting ? "처리 중..." : "회원가입"}
      </Button>
      <Link href="/login">로그인</Link>
    </>
  );
}
```

---

## 6. 브라우저가 받는 실제 HTML

서버가 `/login` 요청에 대해 브라우저로 전송하는 파일의 실제 내용이다.
서버 컴포넌트(LoginPage, AuthLayout, RootLayout)와 클라이언트 컴포넌트(LoginForm, Providers)의
**초기 HTML이 모두 합쳐진 하나의 파일**이다.

```html
<!DOCTYPE html>
<html lang="en" class="__variable_geist_sans __variable_geist_mono h-full antialiased">
  <head>
    <meta charset="utf-8" />
    <title>Create Next App</title>
    <meta name="description" content="Generated by create next app" />
    <link rel="stylesheet" href="/_next/static/css/app.css" />
  </head>
  <body class="min-h-full flex flex-col">

    <!-- Providers (TanStack Query 래퍼 — 클라이언트 컴포넌트, 초기 HTML만) -->
    <div>

      <!-- AuthLayout (서버 컴포넌트) -->
      <main class="flex min-h-screen items-center justify-center">

        <!-- LoginPage (서버 컴포넌트 — 카드 래퍼) -->
        <div class="bg-card text-card-foreground rounded-[var(--radius)] border border-border shadow-sm p-6 w-full max-w-sm space-y-4">

          <!-- LoginForm (클라이언트 컴포넌트 — 초기 HTML, 이벤트 없음) -->
          <h1 class="text-3xl font-bold tracking-tight text-foreground">로그인</h1>

          <div class="space-y-1">
            <label class="text-xs font-medium text-muted-foreground">이메일</label>
            <input type="email" placeholder="name@example.com" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-muted-foreground">비밀번호</label>
            <input type="password" placeholder="••••••" />
          </div>

          <button class="w-full">로그인</button>

          <p class="text-center text-sm text-muted-foreground">
            계정이 없으신가요?
            <a href="/register">회원가입</a>
          </p>

        </div>
      </main>
    </div>

    <!-- 클라이언트 컴포넌트(LoginForm, Providers)를 위한 JS 번들 링크 -->
    <!-- 서버 컴포넌트(LoginPage, AuthLayout)를 위한 JS는 없다 -->
    <script src="/_next/static/chunks/main.js"></script>
    <script src="/_next/static/chunks/app.js"></script>

  </body>
</html>
```

이 HTML 안에는 `onClick`, `useForm`, `useState` 가 단 하나도 없다.
전부 정적인 태그다. 버튼을 눌러도 아무 일이 일어나지 않는다.

맨 아래 `<script>` 태그가 **LoginForm과 Providers의 JS 번들**이다.
브라우저가 이것을 받아 실행한 후에야 버튼 클릭이 동작한다.

---

## 7. JS 번들의 내용과 전송 시점

### 내용

| 파일 | 내용 |
|---|---|
| `main.js` | React 런타임, Next.js 라우터 등 프레임워크 공통 코드 |
| `app.js` | 현재 페이지의 클라이언트 컴포넌트 코드 (LoginForm, Providers의 useForm, signIn, useRouter 등) |

`app.js`에는 **현재 /login 페이지에 필요한 클라이언트 컴포넌트만** 포함된다.
`CartIcon`, `SearchBar`, `AddToCartButton` 등 다른 페이지의 클라이언트 컴포넌트는 해당 페이지 요청 시 별도 번들로 전송된다.
이것을 **코드 스플리팅**이라 한다.

### 전송 시점

HTML이 브라우저에 도착한 직후, 브라우저가 `<script>` 태그를 파싱하는 순간 자동으로 요청한다.
HTML 수신과 JS 요청은 거의 동시에 일어난다.

---

## 8. Hydration — 왜 두 번 요청하는가

서버에서 생성된 HTML은 **정적인 껍데기**다.

```html
<input type="email" placeholder="name@example.com" />
<button>로그인</button>
```

이 상태에서는 버튼을 눌러도 아무 일이 일어나지 않는다. 이벤트 핸들러가 없기 때문이다.

브라우저가 JS 번들을 받아 실행하면 React가 **이미 그려진 HTML 위에**
`onClick`, `onChange` 등 이벤트 핸들러를 **연결(attach)** 한다.
이 과정을 **Hydration(수화)** 이라 한다.

```
HTML (껍데기)  +  JS 번들  =  동작하는 화면
   서버 전송        브라우저 요청 후 수신
```

Hydration 완료 후에야 사용자가 이메일을 입력하고 버튼을 눌러 로그인할 수 있다.

---

## 9. 페이지 이동 시 깜빡임이 없는 이유

로그인 페이지에서 "회원가입" 링크를 클릭하면 화면이 깜빡이지 않는다.

최초 `/login` 요청으로 받은 JS 번들 안에는 Next.js 클라이언트 라우터가 포함되어 있다.
Hydration 이후부터는 이 라우터가 활성화되어 링크 클릭을 가로챈다.

```
회원가입 링크 클릭 후 흐름:

1. Next.js 라우터가 서버에 /register의 RSC Payload 요청
   (HTML 전체가 아닌 RegisterPage 렌더링 결과만 JSON으로 수신)
2. React가 현재 화면에서 바뀐 부분만 교체
3. <html>, <head>, 공통 레이아웃은 그대로 유지
4. 깜빡임 없이 전환 완료
```

**최초 요청만 풀 HTML을 서버에서 받는다.**
이후 페이지 이동은 JS가 처리하기 때문에 깜빡임 없이 부드럽게 전환된다.

이것이 Next.js가 **"첫 로드는 SSR, 이후 이동은 CSR"** 로 동작하는 방식이다.

---

## 10. 이 패턴이 가져오는 효과

### 화면을 빠르게 보여준다

서버가 HTML을 먼저 완성해서 보내기 때문에 브라우저는 JS 번들을 기다리지 않고 바로 화면을 그린다.
JS가 무겁거나 네트워크가 느려도 사용자는 빈 화면 대신 로그인 폼을 즉시 본다.

### 브라우저가 처리할 JS를 최소화한다

서버 컴포넌트는 JS를 브라우저로 보내지 않는다.
클라이언트 컴포넌트만 JS가 전송되므로 브라우저가 파싱·실행할 코드가 줄어든다.
카드 래퍼 하나의 절감은 미미하지만, 앱 전체에서 이 패턴을 지키면 누적 효과가 크다.

### 한 줄 원칙

> **서버가 할 수 있는 일은 서버에서 끝내고, 브라우저는 상호작용에만 집중하게 한다.**

---

## 11. 이 프로젝트의 컴포넌트 분류

### 현재 "use client" 선언 컴포넌트

| 컴포넌트 | 이유 |
|---|---|
| `LoginForm.tsx` | useForm, signIn, useRouter |
| `RegisterForm.tsx` | useForm, useRouter |
| `CartIcon.tsx` | Zustand 장바구니 상태 구독 |
| `SearchBar.tsx` | useState, useRouter |
| `Providers.tsx` | QueryClientProvider (TanStack Query 초기화) |

### 구현 시 "use client"가 필요한 컴포넌트

| 컴포넌트 | 필요한 이유 |
|---|---|
| `AddToCartButton.tsx` | 장바구니 담기 클릭 → Zustand 상태 변경 |
| `BannerSlider.tsx` | 슬라이드 자동 전환 → useState + useEffect |
| `CheckoutForm.tsx` | 주문 폼 → useForm |
| `RecentTracker.tsx` | 최근 본 상품 기록 → localStorage + useEffect |
| `CategoryFilter.tsx` | 선택 필터 상태 → useState |

### 권장 원칙

> Next.js 공식 권장: **`"use client"`는 실제로 필요한 가장 안쪽 컴포넌트에만 선언하라.**
> 페이지 파일(`page.tsx`)은 서버 컴포넌트로 유지하고,
> 상호작용이 필요한 부분만 별도 컴포넌트로 분리해 `"use client"`를 붙인다.
