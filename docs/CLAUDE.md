# CLAUDE.md — 쇼핑몰 앱 (Shopping Mall)

이 파일은 이 프로젝트에 특화된 내용만 기술한다.
범용 원칙(워크플로우, 네이밍 컨벤션, 브랜치 전략 등)은 `~/.claude/CLAUDE.md`(전역)에 있으며
이 파일에 중복 기술하지 않는다.

---

## Tech Stack & Version Control (AI Strict Policy)

**🚨 [치명적 주의사항 - AI 버전 통제 정책]**
AI는 아래 명시된 기술 스택의 **정확한 버전**만을 사용하여 코드를 작성하고 패키지를 설치해야 합니다. 교육용 프로젝트의 안정성을 위해, 임의로 `latest` 태그를 사용하거나 상위 버전으로 업데이트하여 강의 환경의 일관성을 훼손하는 행위를 엄격히 금지합니다. 버전 변경이 불가피한 경우 반드시 사용자(강사)에게 먼저 사유를 설명하고 명시적인 승인을 받아야 합니다.

| 기술 | 고정 버전 (`package.json` 기준) | 역할 |
| --- | --- | --- |
| Next.js (App Router) | `16.2.6` | 풀스택 프레임워크 (서버 컴포넌트, API Route) |
| React | `19.2.4` | UI 라이브러리 |
| Prisma | `7.8.0` | 직관적인 ORM, SQL 스키마 자동 생성 및 타입 제공 |
| PostgreSQL (`pg`) | `^8.21.0` | 관계형 데이터베이스 드라이버 |
| NextAuth.js | `^5.0.0-beta.31` | 인증 및 보안 세션 관리 (Auth.js) |
| Zustand | `^5.0.13` | 장바구니 등 클라이언트 상태 전역 관리 |
| TailwindCSS | `^4.0.0` | 유틸리티 클래스 기반 스타일링 |
| Shadcn UI | `^4.7.0` | Tailwind 기반 컴포넌트 라이브러리 |
| React Hook Form | `^7.76.0` | 폼 상태 관리 및 유효성 검사 |
| Zod | `^4.4.3` | 스키마 검증 |
| TanStack Query | `^5.100.11` | 비동기 데이터 패칭 및 서버 상태 관리 |
| bcryptjs | `^3.0.3` | 비밀번호 단방향 암호화 (보안) |
| lucide-react | `^1.16.0` | UI 아이콘 라이브러리 |
| @hookform/resolvers | `^5.2.2` | React Hook Form과 Zod 스키마 연결 |

---

## Commands

```bash
# Prisma 마이그레이션 적용 및 클라이언트 생성 (DB 스키마 동기화)
npx prisma migrate dev --name init

# Prisma GUI 스튜디오 열기 (DB 데이터 웹으로 관리)
npx prisma studio

# 개발 서버 실행
npm run dev
```

---

## ERD 툴

| 환경 | 툴 | 용도 |
| --- | --- | --- |
| 온라인 | [DrawDB](https://www.drawdb.app/) | 브라우저에서 ERD 작성 & 시각화. 가입 불필요, 완전 무료 |
| 오프라인 | [DBeaver](https://dbeaver.io/) | 로컬 DB 연결 및 ERD 확인. Community Edition 무료 |

---

## Development Notes

프로젝트 작업 내역의 진척도는 `docs/work.md`에서 10일 커리큘럼 마일스톤에 맞추어 트래킹한다. 완료된 작업은 `docs/history.md`로 이동한다.
