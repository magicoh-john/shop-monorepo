# 스펙 10 — Google 소셜 로그인 (NextAuth OAuth)

## 목표
기존 이메일/비밀번호 로그인에 Google OAuth를 추가한다.

## 완료 기준
- 로그인 페이지에 "Google로 로그인" 버튼이 있다
- Google 계정으로 최초 로그인 시 자동으로 User 레코드가 생성된다
- 소셜 로그인 사용자는 비밀번호 없이 로그인된다
- 기존 이메일/비밀번호 로그인은 그대로 동작한다

---

## DB 스키마 변경

소셜 로그인 사용자는 `password`가 없으므로 nullable로 변경한다.

```prisma
// packages/database/prisma/schema.prisma
model User {
  password  String?    // String → String? (nullable)
  // 나머지 필드 그대로
}
```

마이그레이션 실행:
```bash
cd packages/database
npx prisma migrate dev --name social-login-nullable-password
```

---

## 환경 변수 추가

```bash
# apps/web/.env.local 에 추가
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

Google Cloud Console에서 OAuth 2.0 클라이언트 ID 발급 필요.
- 승인된 리다이렉트 URI: `http://localhost:3000/api/auth/callback/google`

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/auth.ts` | 수정 — Google Provider 추가 |
| `src/app/(auth)/login/page.tsx` | 수정 — Google 로그인 버튼 추가 |
| `packages/database/prisma/schema.prisma` | 수정 — password nullable |

---

## 구현 순서

### 1. auth.ts 수정 — Google Provider 추가

```ts
// src/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@my-project/database';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      // 기존 로직 그대로 유지
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Google 로그인 시 DB에 사용자 자동 생성
      if (account?.provider === 'google') {
        const existing = await prisma.user.findUnique({ where: { email: user.email! } });
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name ?? '사용자',
              role: 'user',
              // password 없음 (nullable)
            },
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email! } });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
  },
});
```

### 2. 로그인 페이지에 Google 버튼 추가

```tsx
// src/app/(auth)/login/page.tsx 에 추가
import { signIn } from '@/auth';

// 기존 이메일 폼 아래에 추가
<div className="mt-4">
  <div className="relative flex items-center">
    <div className="flex-1 border-t border-border" />
    <span className="mx-3 text-xs text-muted-foreground">또는</span>
    <div className="flex-1 border-t border-border" />
  </div>
  <form
    action={async () => {
      'use server';
      await signIn('google', { redirectTo: '/' });
    }}
    className="mt-3"
  >
    <button
      type="submit"
      className="w-full border border-border rounded-[calc(var(--radius)-2px)] py-2 text-sm text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2"
    >
      Google로 로그인
    </button>
  </form>
</div>
```

---

## 패키지 설치

NextAuth v5에는 Google Provider가 내장되어 있으므로 추가 설치 불필요.
