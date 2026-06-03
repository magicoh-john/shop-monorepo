import { type DefaultSession } from "next-auth";

// NextAuth 기본 타입(Session, User)에 이 프로젝트에서 추가한 id, role 필드를 확장한다.
// 이 파일이 없으면 session.user.id, session.user.role 사용 시 TypeScript 오류가 발생한다.
// declare module은 기존 라이브러리 타입을 덮어쓰지 않고 확장하는 TypeScript 문법이다.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}
