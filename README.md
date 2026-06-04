# Shopping Mall App (Monorepo)

## 기본 프로젝트
본 프로젝트는 풀스택 쇼핑몰 서비스 구축을 위한 레포지토리입니다. 
Next.js와 Prisma를 기반으로 구현되며, 향후 다양한 플랫폼과 서비스 확장을 고려하여 **pnpm 워크스페이스 기반의 모노레포(Monorepo) 구조**로 설계되었습니다.

## 기능개선 프로젝트 : Redis, WebSocket 기능 추가

기본 프로젝트에서 발전하여 **Redis**와 **WebSocket**을 활용한 두 가지 핵심 기능을 개선하였습니다.  
본 프로젝트의 모든 기능은 **학생들과 함께 직접 테스트하며 검증**한 결과물입니다.

### 🛒 장바구니 — LocalStorage → Redis 서버 저장소로 전환

기본 프로젝트에서는 장바구니 데이터를 브라우저의 **LocalStorage**에 저장하는 방식(Zustand persist)을 사용했습니다.  
기능 개선 프로젝트에서는 장바구니를 **서버의 Redis 메모리**에 저장하도록 변경하였습니다.

| 구분 | 기본 프로젝트 | 기능 개선 프로젝트 |
|---|---|---|
| 저장 위치 | 브라우저 LocalStorage | 서버 Redis 메모리 |
| 접근 방식 | 클라이언트 전용 (Zustand persist) | 서버 API를 통한 읽기/쓰기 |
| 브라우저 간 공유 | ❌ 불가 | ✅ 가능 (로그인 기준) |
| 탭/기기 동기화 | ❌ 불가 | ✅ 가능 |

### 💬 채팅 — Redis Pub/Sub 기반 멀티 서버 메시지 공유

기본 프로젝트에는 없던 **실시간 채팅 기능**을 WebSocket과 Redis를 결합하여 구현하였습니다.  
단일 서버 메모리에 메시지를 저장할 경우 서버 인스턴스가 여러 개일 때 다른 서버에 연결된 사용자끼리 메시지를 주고받을 수 없는 문제가 발생합니다.  
이를 해결하기 위해 **Redis Pub/Sub** 채널을 중간 브로커로 사용하여, 서로 다른 서버에 접속한 사용자들도 동일한 채팅방에서 실시간으로 메시지를 교환할 수 있도록 설계하였습니다.

```
[클라이언트 A] ──WebSocket──▶ [서버 1] ──PUBLISH──▶ [Redis Pub/Sub]
                                                            │
[클라이언트 B] ──WebSocket──▶ [서버 2] ◀──SUBSCRIBE────────┘
```

---

## 🏗 프로젝트 구조 분석 및 확장 계획

본 프로젝트는 독립적으로 실행되는 애플리케이션을 담는 `apps/` 폴더와 앱 간에 공유하는 공통 라이브러리를 담는 `packages/` 폴더로 역할을 명확히 분리하여 관리합니다.

현재는 웹 브라우저용 Next.js 애플리케이션(`web`)이 중심이지만, 향후 모바일 앱(`mobile`)과 인공지능 모듈(`ai`) 등이 추가될 것에 대비하여 유연하게 확장 가능한 구조로 구성되었습니다.

### 디렉토리 트리 구조

```text
shop-monorepo/
├── apps/
│   ├── web/          # Next.js (App Router) 기반 쇼핑몰 웹 프론트엔드/백엔드
│   ├── mobile/       # (예정) React Native / Expo 기반 모바일 쇼핑 앱
│   └── ai/           # (예정) Python / FastAPI 기반 상품 추천 및 이미지 분석 모듈
│
├── packages/
│   ├── database/     # Prisma, PostgreSQL 등 전체 DB 스키마 및 마이그레이션 도구
│   ├── types/        # 모듈 간 공유되는 공통 TypeScript 타입
│   └── ui/           # Shadcn UI, Tailwind 기반 디자인 시스템 공유 컴포넌트
│
├── docs/             # PRD, 디자인 가이드, 아키텍처 등 프로젝트 산출물 문서
├── pnpm-workspace.yaml # pnpm 워크스페이스 범위(apps/*, packages/*) 설정
└── package.json      # 루트 패키지 설정 및 모노레포 전체 실행 스크립트
```

---

## 📦 `node_modules` 분석 및 위치

이 프로젝트는 패키지 매니저로 `pnpm`을 사용합니다. pnpm의 워크스페이스 기능과 심볼릭 링크(Symlink) 방식을 사용하기 때문에 `node_modules`는 단일 폴더에 존재하지 않고 여러 곳에 분산 생성됩니다.

실제 프로젝트 내 `node_modules`가 생성되는(또는 생성될) 위치는 다음과 같습니다:

1. **루트 디렉토리 (`shop-monorepo/node_modules/`)**
   - 모든 패키지의 실제 데이터가 저장되는 가상 스토어(`.pnpm/`)가 이곳에 존재합니다.
   - 전체 프로젝트에서 공통으로 쓰이는 도구(예: TypeScript, ESLint)의 호이스팅된 의존성이 위치합니다.

2. **각 App별 디렉토리 (`shop-monorepo/apps/*/node_modules/`)**
   - `apps/web/node_modules/`: Next.js, React, Tailwind CSS 등 웹 애플리케이션 구동에 직접 필요한 패키지들이 위치합니다.
   - 향후 `apps/mobile`, `apps/ai` 모듈이 추가될 때마다 해당 모듈 전용 `node_modules` 폴더가 각각 생성됩니다.

3. **각 Package별 디렉토리 (`shop-monorepo/packages/*/node_modules/`)**
   - `packages/database/node_modules/`: `@prisma/client` 등 데이터베이스 조작에 필요한 패키지들이 위치합니다.

> **💡 분석 요약**  
> `node_modules` 폴더는 루트에 1개, 그리고 `apps/`와 `packages/` 하위의 각 모듈별로 1개씩 생성되므로 **모듈 개수 + 1(루트) 개**만큼 여러 군데에 존재하게 됩니다.  
> 하지만 하위 모듈들의 `node_modules` 안에는 파일이 복사된 것이 아니라 **루트의 글로벌 스토어를 참조하는 심볼릭 링크**만 존재하기 때문에 디스크 용량은 획기적으로 절약되며 설치 속도 또한 매우 빠릅니다.

---

## 📋 `package.json` 역할 분리

모노레포 구조에서는 `package.json`이 여러 곳에 존재하며, 각각 담당하는 역할이 다릅니다. 현재 프로젝트에는 총 **3개**가 있습니다.

### ① 루트 `package.json` — 모노레포 총괄 지휘부
- 전체 워크스페이스의 공통 스크립트 정의 (`pnpm dev`, `pnpm build`)
- `--filter` 옵션으로 특정 패키지에 명령을 위임
- Node.js 최소 버전 강제 (`>=18.0.0`)
- 실제 라이브러리는 설치하지 않음

### ② `apps/web/package.json` — Next.js 앱 전용
- Next.js, React 등 웹 앱 구동에 필요한 패키지 관리
- `@my-project/database`를 `workspace:*`로 참조하여 내부 패키지와 연결
- `dev`, `build`, `start` 스크립트 보유

### ③ `packages/database/package.json` — Prisma 패키지 전용
- `@prisma/client`, `prisma`, `dotenv` 등 DB 관련 패키지만 관리
- `main`/`types`를 `src/client.ts`로 지정하여 다른 앱에서 import 가능하도록 노출
- `@my-project/database`라는 이름으로 워크스페이스 내에서 참조됨

```
루트 package.json              → 전체 실행 스크립트 (pnpm dev)
    └── apps/web/package.json          → Next.js 앱 의존성
            └── @my-project/database  ← packages/database/package.json
```

---

## 🚀 기술 스택 (Tech Stack)

안정적인 서비스 운영 및 일관성 있는 개발 환경을 위해 아래 고정된 버전의 기술 스택을 사용합니다.

- **Core Framework**: Next.js 16.2.6 (App Router), React 19.2.4
- **Database & ORM**: PostgreSQL (^8.21.0), Prisma (7.8.0)
- **Authentication**: NextAuth.js (^5.0.0-beta.31)
- **State Management**: Zustand (^5.0.13), TanStack Query (^5.100.11)
- **Styling**: TailwindCSS (^4.0.0), Shadcn UI (^4.7.0)
- **Form & Validation**: React Hook Form (^7.76.0), Zod (^4.4.3)

---

##  프로젝트 초기 세팅 가이드 (Getting Started)

GitHub에서 프로젝트를 최초로 내려받은 후, 아래 순서에 따라 환경을 구성해주세요.

### 1. 관련 라이브러리(의존성) 설치
루트 디렉토리에서 아래 명령어를 한 번만 실행하면 전체 워크스페이스(`apps/`, `packages/`)에 필요한 모든 모듈이 한 번에 설치됩니다.

> **⚠️ 주의:** 만약 `pnpm` 명령어를 인식하지 못한다는 에러가 발생한다면 시스템에 pnpm이 설치되어 있지 않은 것입니다. 이 경우 먼저 터미널에서 `npm install -g pnpm` 명령어를 실행하여 pnpm을 전역으로 설치해 주세요.

> **💡 참고:** 프로젝트를 처음 다운로드(Clone)한 직후에는 루트 경로를 비롯하여 `apps/web/`이나 `packages/database/` 하위에 `node_modules` 폴더가 존재하지 않아 보이지 않습니다. 아래의 설치 명령어를 실행해야만 비로소 pnpm이 의존성을 연결하여 각 모듈 폴더 내부에 `node_modules`(심볼릭 링크)를 자동으로 생성해 줍니다.

```bash
pnpm install
```

### 2. 환경 변수 설정 (.env)

각 패키지에는 `.env.example` 파일이 제공됩니다. 이 파일을 복사하여 실제 `.env` 파일을 만들고 본인의 환경에 맞게 값을 채워주세요.

> **🔒 보안 참고:** `.env`, `.env.local` 파일은 `.gitignore`에 등록되어 있어 GitHub에 올라가지 않습니다. 반면 `.env.example`은 예외 처리(`!.env.example`)되어 있어 커밋됩니다. 비밀번호나 시크릿 키가 담긴 실제 `.env` 파일은 절대 커밋하지 마세요.

**`packages/database/.env` 생성**
```bash
# packages/database/ 디렉토리에서 실행
cp .env.example .env
```

**`apps/web/.env.local` 생성**
```bash
# apps/web/ 디렉토리에서 실행
cp .env.example .env.local
```

각 `.env` 파일을 열어 아래 항목을 본인 환경에 맞게 수정하세요.

| 변수 | 설명 | 예시 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://postgres:1234@localhost:5432/shopping_app` |
| `AUTH_SECRET` | NextAuth.js 시크릿 키 (`npx auth secret`으로 생성) | `your-auth-secret-here` |
| `NEXTAUTH_URL` | 개발 서버 주소 | `http://localhost:3000` |

> **💡 참고:** `packages/database/.env`와 `apps/web/.env.local`의 `DATABASE_URL` 값은 반드시 동일해야 합니다. Prisma CLI는 `packages/database/.env`를, Next.js 앱은 `apps/web/.env.local`을 각각 읽습니다.

---

### 3. 데이터베이스 테이블 생성 및 Prisma Client 준비
`packages/database/prisma/schema.prisma`에 정의된 스키마를 바탕으로 실제 DB에 테이블을 만들고, 앱에서 사용할 Prisma Client를 생성합니다.

> **⚠️ 중요:** 마이그레이션 명령어를 실행하기 전에 PostgreSQL 환경에 `shopping_app`이라는 이름의 데이터베이스가 미리 생성되어 있어야 합니다. (DBeaver, pgAdmin, 또는 psql CLI 등을 통해 직접 빈 데이터베이스를 생성해 주세요.)





```bash
# database 모듈 디렉토리로 이동하여 prisma 명령어 실행
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
```
> **💡 팁:** `migrate dev`로 DB 테이블을 생성한 후, `prisma generate`를 별도로 실행하여 Prisma Client(User, Product 등 타입)를 생성합니다. Prisma v6부터는 두 명령어를 순서대로 실행해야 합니다.

**🔍 생성된 Prisma Client 위치 확인**  
생성된 Prisma Client 파일들은 pnpm 가상 스토어인 `shop-monorepo/node_modules/.pnpm/@prisma+client@버전/node_modules/.prisma/client/`에 물리적으로 저장됩니다. `packages/database/node_modules/`에는 이를 가리키는 심볼릭 링크만 존재합니다. 이 구조 덕분에 각 애플리케이션(`apps/web`, `apps/mobile` 등)에서는 개별적으로 DB 세팅을 할 필요 없이 `packages/database` 모듈을 임포트하는 것만으로 타입 안전한(Type-Safe) DB 작업을 할 수 있습니다.

### 4. 개발 서버 실행

```bash
# 루트 디렉토리에서 web 애플리케이션 개발 서버 실행
pnpm dev
```