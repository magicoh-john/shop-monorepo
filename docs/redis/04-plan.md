# Redis 구현 계획

## 구현 단계 개요

| Phase | 내용 | Redis 필요성 |
|---|---|---|
| 1 | Redis 환경 설정 | 기반 작업 |
| 2 | 비로그인 장바구니 전환 | 선택적 (UX 개선) |
| 3 | 상담원 채팅 기능 | **필수** (다중 서버 메시지 중계) |

---

## Phase 1 — Redis 환경 설정

- Redis 서버 연결 설정
- 환경 변수 구성 (`REDIS_URL`)
- 연결 유틸리티 작성 (`apps/web/src/lib/redis.ts`)

### 클라이언트 선택

| 선택지 | 환경 | 비고 |
|---|---|---|
| `ioredis` | 로컬 Redis 서버 | 개발 환경 |
| `@upstash/redis` | 클라우드(Upstash) | 서버리스 환경에 적합 |

---

## Phase 2 — 비로그인 장바구니 전환

> 로그인 회원은 DB에서 SSR이 가능하므로 대상 아님

- 비로그인 세션 ID 발급 (쿠키에 저장)
- 장바구니 키: `cart:{sessionId}` (TTL 7일)
- SSR 시점에 서버에서 Redis 조회 → 초기 HTML에 포함
- 로그인 시 `cart:{sessionId}` → `cart:{userId}` 병합 후 세션 키 삭제

---

## Phase 3 — 상담원 채팅 기능

- WebSocket 서버 구성
- 채팅방 채널 설계: `chat:{roomId}`
- 메시지 발행: `PUBLISH chat:{roomId} {메시지}`
- 메시지 구독: `SUBSCRIBE chat:{roomId}`
- 입장/퇴장 이벤트 처리
- 채팅 이력 저장 (DB 또는 Redis List)

---

## 구현 원칙

1. Phase 1 완료 후 Phase 2, 3 시작
2. Phase 2와 Phase 3는 별도 브랜치에서 진행
3. 단일 서버 환경에서 먼저 구현 후 다중 서버 시나리오 검증
