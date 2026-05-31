import type { NextAuthConfig } from "next-auth";

const protectedRoutes = ["/mypage", "/checkout", "/order"];
const adminRoutes = ["/admin"];

// Edge Runtime 호환 설정 — Prisma import 금지
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.role) {
        (session.user as any).role = token.role;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = (auth?.user as any)?.role;
      const pathname = nextUrl.pathname;

      const isAdminRoute = adminRoutes.some((route) =>
        pathname.startsWith(route),
      );
      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        if (userRole !== "admin")
          return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route),
      );
      if (isProtectedRoute && !isLoggedIn) return false;

      return true;
    },
  },
  providers: [],
};
