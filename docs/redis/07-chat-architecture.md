# 채팅 기능 아키텍처

## 관련 파일 전체 목록

| 파일 | 역할 |
|---|---|
| `apps/web/server.ts` | Next.js Custom Server + WebSocket 서버 진입점 |
| `apps/web/src/lib/websocket.ts` | WebSocket 연결 관리 + Redis Pub/Sub 중계 |
| `apps/web/src/lib/redisPubSub.ts` | Pub/Sub 전용 Redis 클라이언트 (publisher/subscriber) |
| `apps/web/src/app/(shop)/chat/page.tsx` | 사용자 채팅 페이지 (서버 컴포넌트) |
| `apps/web/src/app/admin/chat/page.tsx` | 상담원 채팅 페이지 (서버 컴포넌트) |
| `apps/web/src/features/chat/components/ChatWindow.tsx` | 사용자 채팅 UI (클라이언트 컴포넌트) |
| `apps/web/src/features/chat/components/AdminChatWindow.tsx` | 상담원 채팅 UI (클라이언트 컴포넌트) |
| `packages/database/prisma/schema.prisma` | ChatRoom, ChatMessage 모델 정의 |

---

## 파일 간 관계

```
[브라우저 - 사용자]          [브라우저 - 상담원]
ChatWindow.tsx               AdminChatWindow.tsx
     │ WebSocket                    │ WebSocket
     │ ws://.../ws?roomId=xxx       │ ws://.../ws?roomId=xxx
     ▼                              ▼
┌─────────────────────────────────────────────┐
│              server.ts                       │
│  Next.js HTTP 서버 + WebSocket 서버 통합     │
│  upgrade 이벤트 → /ws 경로만 websocket.ts로  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│            websocket.ts                      │
│  - rooms Map으로 연결된 클라이언트 관리       │
│  - 메시지 수신 시:                           │
│    1. DB에 저장 (Prisma)                     │
│    2. Redis에 발행 (PUBLISH)                 │
│  - Redis 수신 시:                            │
│    3. 해당 채팅방 클라이언트에 전달 (send)    │
└──────┬───────────────────┬──────────────────┘
       │                   │
       ▼                   ▼
┌──────────────┐   ┌───────────────────┐
│ redisPubSub  │   │   Prisma (DB)     │
│  publisher   │   │  chatMessage      │
│  subscriber  │   │  chatRoom         │
└──────┬───────┘   └───────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│               Redis 서버                  │
│  채널: chat:{roomId}                      │
│  PUBLISH → 구독 중인 모든 서버로 전달      │
└──────────────────────────────────────────┘

[페이지 초기 렌더링]
chat/page.tsx (서버)         admin/chat/page.tsx (서버)
  └─ DB에서 기존 메시지 조회      └─ DB에서 채팅방 목록 + 메시지 조회
  └─ ChatWindow에 props 전달     └─ AdminChatWindow에 props 전달
```

---

## 메시지 전달 흐름 (단계별)

### 사용자가 메시지를 보낼 때

```
1. 사용자가 입력창에 메시지 입력 → 전송 버튼 클릭
   (ChatWindow.tsx)

2. WebSocket으로 메시지 전송
   ws.send({ senderId, senderRole: 'user', content })

3. server.ts가 WebSocket 업그레이드 요청을 받아 websocket.ts로 전달

   > **업그레이드(Upgrade)란?**
   > 브라우저는 WebSocket 연결을 시작할 때 먼저 HTTP 요청을 보내며 헤더에 `Upgrade: websocket`을 포함시킨다.
   > 서버가 이를 수락하면 HTTP에서 WebSocket 프로토콜로 전환된다.
   >
   > ```
   > 브라우저 → 서버: HTTP 요청
   >   Upgrade: websocket
   >   Connection: Upgrade
   >
   > 서버 → 브라우저: HTTP 101 Switching Protocols
   >   ← 이후부터 ws:// 프로토콜로 양방향 통신 시작
   > ```
   >
   > HTTP는 요청-응답이 끝나면 연결이 닫히지만, WebSocket은 한 번 연결되면 서버와 클라이언트가 연결을 유지하며 계속 양방향으로 통신할 수 있다.
   > `server.ts`의 `server.on('upgrade', ...)` 이벤트가 이 전환 시점을 잡아 처리한다.

4. websocket.ts의 ws.on('message') 이벤트 실행
   ├── 4-1. DB에 저장: prisma.chatMessage.create(...)
   └── 4-2. Redis에 발행: publisher.publish('chat:{roomId}', 메시지)

5. Redis가 'chat:{roomId}' 채널 구독자 전체에게 메시지 전달

6. websocket.ts의 subscriber.on('message') 이벤트 실행
   └── 해당 roomId에 연결된 모든 WebSocket 클라이언트에게 send()

7. 상담원의 AdminChatWindow.tsx가 onmessage 이벤트로 수신
   └── setMessages()로 화면 업데이트
```

---

## Redis의 역할

### Redis가 없을 때 (단일 서버)

```
사용자 → 서버 1 → 상담원 (서버 1에 연결된 경우만 전달 가능)
```

서버가 1대이면 모든 WebSocket 연결이 같은 서버에 있으므로 Redis 없이도 동작한다.
`rooms` Map이 메모리에서 연결을 관리하기 때문이다.

### Redis가 필요할 때 (다중 서버)

```
사용자 → 서버 1 (rooms Map에 사용자 연결 있음)
상담원 → 서버 2 (rooms Map에 상담원 연결 있음)

서버 1의 rooms Map에는 상담원 연결이 없음 → 직접 전달 불가
```

Redis Pub/Sub가 두 서버를 연결하는 **중간 허브** 역할을 한다.

```
사용자 → 서버 1 → PUBLISH chat:room_1 → Redis → SUBSCRIBE → 서버 2 → 상담원
```

서버가 몇 대든 Redis 채널을 구독하고 있으면 메시지를 받을 수 있다.

### `redisPubSub.ts`가 두 개의 클라이언트를 만드는 이유

```ts
export const publisher = new Redis(process.env.REDIS_URL!);
export const subscriber = new Redis(process.env.REDIS_URL!);
```

ioredis에서 `subscribe()`를 호출한 연결은 **구독 전용 상태**가 된다.
구독 중인 연결로는 `publish()` 같은 일반 명령을 실행할 수 없다.
따라서 발행용과 구독용을 별도 연결로 분리해야 한다.

---

## 데이터 저장 구조

### Redis (실시간 중계)

```
채널: chat:{roomId}
용도: 메시지를 서버 간에 실시간으로 전달
보존: 전달 후 사라짐 (영구 저장 아님)
```

### PostgreSQL (영구 저장)

```
chat_rooms    : 채팅방 (사용자 1명당 1개)
chat_messages : 메시지 이력 (roomId, senderId, senderRole, content)
```

페이지를 새로고침하거나 나중에 다시 접속해도 이전 대화 내역을 볼 수 있는 이유는
PostgreSQL에 영구 저장하기 때문이다.
Redis는 실시간 전달에만 사용하며 메시지를 보관하지 않는다.
