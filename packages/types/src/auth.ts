/**
 * 인증 관련 공통 타입
 *
 * 왜 필요한가?
 * DB의 User 테이블에는 password 해시가 저장되어 있다.
 * API 응답이나 클라이언트 컴포넌트에 DB 모델을 그대로 전달하면
 * password가 노출될 위험이 있다.
 * 이 파일의 User 인터페이스는 password를 의도적으로 제외하여
 * 클라이언트에 안전하게 전달할 수 있는 사용자 정보만 포함한다.
 *
 * 어떻게 사용하는가?
 * - API Route에서 사용자 정보를 JSON으로 응답할 때
 * - Server Action에서 클라이언트로 사용자 데이터를 반환할 때
 * - 컴포넌트 props로 사용자 정보를 전달할 때
 *
 * 예시:
 *   import type { User } from '@my-project/types';
 *
 *   // API Route
 *   const user: User = {
 *     id: dbUser.id,
 *     email: dbUser.email,
 *     name: dbUser.name,
 *     role: dbUser.role,
 *     createdAt: dbUser.createdAt.toISOString(),
 *     // password는 포함하지 않음 → 클라이언트에 안전
 *   };
 *   return Response.json(user);
 *
 * 참고: 로그인 세션(NextAuth)은 apps/web/src/types/next-auth.d.ts에서 별도 관리한다.
 * NextAuth 세션 안의 user 객체와 이 User 인터페이스는 같은 역할을 한다.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin'; // 'user': 일반 사용자, 'admin': 관리자 (백오피스 접근 가능)
  createdAt: string;       // ISO 8601 문자열 (DB의 DateTime → toISOString() 변환)
}

/**
 * Session: 로그인된 사용자의 세션 정보
 *
 * NextAuth가 반환하는 세션 객체와 동일한 구조.
 * apps/web/src/auth.ts의 session 콜백에서 이 구조로 만들어진다.
 *
 * 예시:
 *   const session = await auth();  // NextAuth의 auth() 함수 호출
 *   session.user.id     // 사용자 ID
 *   session.user.role   // 'user' | 'admin'
 *   session.expires     // 세션 만료 시각 (ISO 8601)
 */
export interface Session {
  user: User;
  expires: string; // 세션 만료 시각 (ISO 8601 문자열)
}
