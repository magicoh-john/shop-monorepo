# Phase 3 — 상담원 채팅 구현 스펙

## 목표

상품 문의 또는 주문 관련 상담을 위한 실시간 채팅 기능을 구현한다.
Redis Pub/Sub를 통해 다중 서버 환경에서도 메시지가 일관되게 전달되는 구조를 학습한다.

---

## 완료 기준

- [ ] 사용자가 채팅 메시지를 보내면 상담원 화면에 실시간으로 표시된다
- [ ] 상담원이 답장을 보내면 사용자 화면에 실시간으로 표시된다
- [ ] Redis Pub/Sub를 통해 메시지가 중계된다
- [ ] 단일 PC에서 두 개의 서버 프로세스로 다중 서버 시나리오를 시연할 수 있다

---

## 기술 구성

### WebSocket

Next.js App Router는 WebSocket을 기본 지원하지 않는다.
별도 Node.js WebSocket 서버를 `apps/web/server.ts`에 작성하고
Next.js와 함께 구동하는 Custom Server 방식으로 구현한다.

| 항목 | 선택 |
|---|---|
| WebSocket 라이브러리 | `ws` |
| 실행 방식 | Next.js custom server (`server.ts`) |

### Redis Pub/Sub

| 항목 | 내용 |
|---|---|
| 채널 | `chat:{roomId}` |
| 메시지 구조 | `{ senderId, senderRole, content }` |
| 발행 | 메시지 수신 시 `PUBLISH chat:{roomId} {메시지}` |
| 구독 | 서버 시작 시 `SUBSCRIBE chat:{roomId}` |

### 채팅방 구조

```
roomId = ChatRoom.id (사용자 1명당 채팅방 1개)

사용자 입장:  /chat
상담원 입장:  /admin/chat?roomId={roomId}
```

---

## 구현 순서

> 각 단계는 이전 단계가 완료된 후 진행한다. 순서를 건너뛰면 import 오류가 발생한다.

---

### 1단계 — Prisma 스키마 추가 + 마이그레이션

채팅 이력을 PostgreSQL에 영구 저장한다. Redis는 실시간 중계만 담당한다.

**`packages/database/prisma/schema.prisma`** 에 아래를 추가한다.

```prisma
// User 모델 안에 추가
chatRoom     ChatRoom?
chatMessages ChatMessage[]

// 파일 하단에 추가
model ChatRoom {
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  user     User          @relation(fields: [userId], references: [id])
  messages ChatMessage[]

  @@map("chat_rooms")
}

model ChatMessage {
  id          String    @id @default(cuid())
  roomId      String    @map("room_id")
  senderId    String    @map("sender_id")
  senderRole  String    @map("sender_role")   // "user" | "admin"
  content     String
  messageType String    @default("TEXT") @map("message_type")  // TEXT | IMAGE | SYSTEM
  isRead      Boolean   @default(false) @map("is_read")
  readAt      DateTime? @map("read_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  deletedAt   DateTime? @map("deleted_at")

  room   ChatRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  sender User     @relation(fields: [senderId], references: [id], onDelete: Cascade)

  @@index([roomId, createdAt(sort: Desc)], map: "idx_message_room_created")
  @@index([roomId, isRead], map: "idx_message_unread")
  @@map("chat_messages")
}
```

마이그레이션 실행 (반드시 `packages/database/` 에서 실행):

```bash
cd packages/database
npx prisma migrate dev --name add-chat
npx prisma generate
```

→ 완료 후 `prisma.chatRoom`, `prisma.chatMessage` 사용 가능

---

### 2단계 — 패키지 설치

루트(`shop-monorepo/`)에서 실행한다.

```bash
pnpm add ws --filter web
pnpm add -D @types/ws --filter web
```

`ws`는 JavaScript로 작성된 라이브러리라 TypeScript 타입 정보가 없다.  
`@types/ws`를 설치하면 아래 두 타입을 사용할 수 있게 된다.

```ts
import { WebSocketServer, WebSocket } from 'ws';

// WebSocketServer: 서버 측 — 클라이언트 연결 요청을 받아 wss.on('connection') 이벤트로 처리
const wss = new WebSocketServer({ server, path: '/ws' });

// WebSocket: 개별 클라이언트 연결 1개를 나타냄 — 메시지 전송(send), 연결 상태 확인(readyState)에 사용
wss.on('connection', (ws: WebSocket) => {
  ws.send('반갑습니다');                        // 이 클라이언트에게 메시지 전송
  console.log(ws.readyState === WebSocket.OPEN); // 연결이 열려있는지 확인
});
```

`-D` 옵션은 devDependency로 설치한다는 의미로, 타입 정보는 개발 중에만 필요하고 실제 실행 파일에는 포함되지 않는다.

---

### 3단계 — `apps/web/src/lib/redisPubSub.ts` 작성

**왜 필요한가**

ioredis에서 `subscribe()`를 실행하면 해당 연결은 구독 전용 상태가 된다.
기존 `redis.ts`(일반 명령용)와 분리해 별도 클라이언트를 만들어야 한다.

```ts
import Redis from 'ioredis';

// 발행(PUBLISH)용
export const publisher = new Redis(process.env.REDIS_URL!);

// 구독(SUBSCRIBE)용 — 이 연결은 subscribe 전용으로만 사용
export const subscriber = new Redis(process.env.REDIS_URL!);
```

---

### 4단계 — `apps/web/src/lib/websocket.ts` 작성

**왜 필요한가**

WebSocket 클라이언트 연결 관리와 Redis Pub/Sub 중계 로직을 담당한다.
메시지를 받으면 Redis에 발행하고, Redis에서 수신한 메시지를 해당 채팅방 클라이언트에게 전달한다.

```ts
import { WebSocketServer, WebSocket } from 'ws';
import { publisher, subscriber } from './redisPubSub';
import { prisma } from '@my-project/database';

// roomId별 연결된 WebSocket 목록
const rooms = new Map<string, Set<WebSocket>>();

export function setupWebSocket(wss: WebSocketServer) {
  // Redis 메시지 수신 → 해당 채팅방 클라이언트에게 전달
  subscriber.on('message', (channel, message) => {
    const roomId = channel.replace('chat:', '');
    const clients = rooms.get(roomId);
    clients?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  wss.on('connection', (ws, req) => {
    const roomId = new URL(req.url!, 'http://localhost').searchParams.get('roomId')!;

    // 채팅방 입장
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId)!.add(ws);
    subscriber.subscribe(`chat:${roomId}`);

    ws.on('message', async (data) => {
      const { senderId, senderRole, content } = JSON.parse(data.toString());

      // DB 저장
      await prisma.chatMessage.create({
        data: { roomId, senderId, senderRole, content },
      });

      // Redis 발행 → 같은 채널을 구독 중인 모든 서버로 전달
      await publisher.publish(`chat:${roomId}`, JSON.stringify({ senderId, senderRole, content }));
    });

    ws.on('close', () => {
      rooms.get(roomId)?.delete(ws);
    });
  });
}
```

---

### 5단계 — `apps/web/server.ts` 작성

**왜 필요한가**

Next.js는 기본적으로 WebSocket을 지원하지 않는다.
WebSocket 연결을 받으려면 Next.js를 직접 Node.js HTTP 서버 위에서 실행하는
Custom Server 방식이 필요하다. 이 파일이 앱의 진입점이 된다.

```ts
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { setupWebSocket } from './src/lib/websocket';

const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // WebSocket 서버를 같은 HTTP 서버에 연결
  const wss = new WebSocketServer({ server, path: '/ws' });
  setupWebSocket(wss);

  server.listen(process.env.PORT ?? 3000, () => {
    console.log(`서버 실행 중: http://localhost:${process.env.PORT ?? 3000}`);
  });
});
```

**패키지 설치** — 루트(`shop-monorepo/`)에서 실행한다.

```bash
pnpm add -D ts-node --filter web
```

`ts-node`는 TypeScript 파일을 컴파일 없이 Node.js에서 직접 실행할 수 있게 해준다.
`server.ts`는 Next.js 빌드 파이프라인 밖에서 실행되므로 별도로 설치해야 한다.

**`apps/web/package.json` 수정** — dev 스크립트를 custom server로 변경한다.

```json
"scripts": {
  "dev": "tsx server.ts"
}
```

> **주의**: `next dev` 명령이 제거되고 `tsx server.ts`가 진입점이 된다.  
> Next.js는 `server.ts` 내부에서 `app.prepare()`를 통해 실행된다.

---

#### server.ts 올바른 코드

```ts
const wss = new WebSocketServer({ noServer: true });
setupWebSocket(wss);

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url!, 'http://localhost').pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
  // /ws 외의 경로(/_next/webpack-hmr 등)는 Next.js가 처리
});
```

---

#### 5단계 트러블슈팅 기록

실제 구현 과정에서 발생한 오류와 해결 과정을 기록한다.

---

**오류 1 — `ts-node` 미설치**

```
'ts-node'은(는) 내부 또는 외부 명령이 아닙니다.
```

- **원인**: `package.json`에 `"dev": "ts-node server.ts"`를 작성했지만 `ts-node` 패키지를 설치하지 않음
- **해결**: `pnpm add -D ts-node --filter web` 실행

---

**오류 2 — ESM 모듈 해석 실패**

```
Error: Cannot find module './src/lib/websocket'
Did you mean to import "./src/lib/websocket.ts"?
```

- **원인**: `tsconfig.json`의 `"module": "esnext"`, `"moduleResolution": "bundler"` 설정은 Next.js 번들러(Turbopack)용이다. `ts-node`는 Node.js 환경에서 실행되므로 이 설정과 충돌한다. Node.js ESM 모드에서는 확장자 없이 모듈을 찾지 못한다.
- **해결 시도**: `ts-node` 대신 ESM을 완전히 지원하는 `tsx`로 교체
  ```bash
  pnpm add -D tsx --filter web
  ```

---

**오류 5 — DB 연결 실패 (DATABASE_URL 미로드)**

```
SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

- **원인 1차 시도**: `tsx server.ts`로 실행하면 Next.js가 `.env.local`을 로드하기 전에 Prisma가 `DATABASE_URL`을 읽으려 한다. `dotenv`를 설치하고 `server.ts` 상단에서 로드하면 해결될 것으로 예상했다.

```bash
pnpm add dotenv --filter web
```

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });
```

- **원인 2차 분석**: 위 방법도 동일한 오류가 발생했다. 근본 원인은 ES 모듈의 `import` 호이스팅이다. `packages/database/src/client.ts`는 모듈 로드 시점에 즉시 `new Pool({ connectionString: process.env.DATABASE_URL })`을 실행한다. ES 모듈에서 모든 `import`는 어떤 코드보다 먼저 평가되므로 `server.ts`의 `config()` 호출은 `client.ts`가 실행된 후에야 실행된다. 즉, `DATABASE_URL`이 설정되기 전에 DB 연결이 시도된다.

```
ES 모듈 실행 순서:
1. client.ts 평가 → new Pool({ connectionString: undefined }) ← DATABASE_URL 없음
2. websocket.ts 평가
3. server.ts 평가 → config() 실행 ← 이미 늦음
```

- **올바른 해결**: `tsx --env-file` 옵션을 사용하면 어떤 모듈보다 먼저 env 파일을 로드한다. `package.json` dev 스크립트를 수정한다.

```json
"dev": "tsx --env-file=.env.local server.ts"
```

`server.ts`의 `import { config } from 'dotenv'` 코드는 제거한다.

---

**오류 4 — Next.js HMR WebSocket 차단**

```
WebSocket connection to 'ws://localhost:3000/_next/webpack-hmr' failed: 400
```

- **원인**: `new WebSocketServer({ server, path: '/ws' })` 방식은 HTTP 서버의 모든 WebSocket 업그레이드 이벤트를 가로챈다. Next.js HMR이 사용하는 `/_next/webpack-hmr` 경로까지 차단되어 로그인 등 앱 전체가 동작하지 않음
- **해결**: `noServer: true` 옵션으로 WebSocket 서버를 생성하고 `server.on('upgrade')` 이벤트에서 `/ws` 경로만 수동으로 처리한다. 나머지 경로는 Next.js가 자동으로 처리한다.

```ts
// ❌ 잘못된 방식 — 모든 WebSocket 업그레이드를 가로챔
const wss = new WebSocketServer({ server, path: '/ws' });

// ✅ 올바른 방식 — /ws 경로만 선별 처리
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url!, 'http://localhost').pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});
```

---

**오류 3 — `package.json` 스크립트 미변경**

```
Error: Cannot find module './src/lib/websocket'  (동일 오류 반복)
```

- **원인**: `tsx`를 설치했지만 `package.json`의 dev 스크립트가 여전히 `ts-node server.ts`로 남아있어 `tsx`가 실행되지 않음
- **해결**: `package.json` dev 스크립트를 `tsx server.ts`로 변경

```json
"scripts": {
  "dev": "tsx server.ts"
}
```

---

### 6단계 — `apps/web/src/features/chat/components/ChatWindow.tsx` 작성

**왜 필요한가**

WebSocket 연결, 메시지 송수신, 채팅 화면 렌더링을 담당하는 클라이언트 컴포넌트다.
이 컴포넌트가 완성된 후 `chat/page.tsx`에서 import할 수 있다.

**왜 `'use client'`인가**

`useEffect`로 WebSocket 연결을 생성하고 `useState`로 메시지 목록을 관리한다.
이 두 훅은 브라우저에서만 동작하며, 서버에는 `new WebSocket(...)` 객체 자체가 존재하지 않는다.
서버에서 실행하면 오류가 발생하므로 반드시 `'use client'`를 선언해야 한다.

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id?: string;
  senderId: string;
  senderRole: string;
  content: string;
}

interface Props {
  roomId: string;
  initialMessages: Message[];
  userId: string;
}

export default function ChatWindow({ roomId, initialMessages, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:3000/ws?roomId=${roomId}`);

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    return () => ws.current?.close();
  }, [roomId]);

  const send = () => {
    if (!input.trim()) return;
    ws.current?.send(JSON.stringify({ senderId: userId, senderRole: 'user', content: input }));
    setInput('');
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold text-foreground mb-4">상담 채팅</h1>
      <div className="h-96 overflow-y-auto border border-border rounded-[var(--radius)] p-4 space-y-2 bg-card mb-4">
        {messages.map((msg, i) => (
          <div key={msg.id ?? i} className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
            <span className={`px-3 py-2 rounded-[calc(var(--radius)-2px)] text-sm ${
              msg.senderId === userId
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="메시지를 입력하세요"
          className="flex-1 border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm bg-background"
        />
        <button
          onClick={send}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-[calc(var(--radius)-2px)] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          전송
        </button>
      </div>
    </div>
  );
}
```

---

### 7단계 — `apps/web/src/app/(shop)/chat/page.tsx` 작성

> 1단계(prisma.chatRoom)와 6단계(ChatWindow) 완료 후 작성한다.

```tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@my-project/database';
import ChatWindow from '@/features/chat/components/ChatWindow';

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // 채팅방이 없으면 자동 생성
  const room = await prisma.chatRoom.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  return (
    <ChatWindow
      roomId={room.id}
      initialMessages={room.messages}
      userId={session.user.id}
    />
  );
}
```

---

### 8단계 — `apps/web/src/features/chat/components/AdminChatWindow.tsx` 작성

**왜 필요한가**

상담원이 사용자 채팅방 목록을 보고 답장하는 클라이언트 컴포넌트다.
`ChatWindow`와 동일한 WebSocket 구조이며 `senderRole: 'admin'`으로 메시지를 전송한다.

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id?: string;
  senderId: string;
  senderRole: string;
  content: string;
}

interface Room {
  id: string;
  user: { name: string; email: string };
  messages: Message[];
}

interface Props {
  rooms: Room[];
  activeRoom: (Room & { messages: Message[] }) | null;
  adminId: string;
}

export default function AdminChatWindow({ rooms, activeRoom, adminId }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(activeRoom?.messages ?? []);
  const [input, setInput] = useState('');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!activeRoom) return;

    setMessages(activeRoom.messages);

    ws.current = new WebSocket(`ws://localhost:3000/ws?roomId=${activeRoom.id}`);
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    return () => ws.current?.close();
  }, [activeRoom?.id]);

  const send = () => {
    if (!input.trim() || !activeRoom) return;
    ws.current?.send(
      JSON.stringify({ senderId: adminId, senderRole: 'admin', content: input })
    );
    setInput('');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex gap-6">
      {/* 채팅방 목록 */}
      <div className="w-64 shrink-0 border border-border rounded-[var(--radius)] bg-card p-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">상담 목록</h2>
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">상담 요청이 없습니다.</p>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => router.push(`/admin/chat?roomId=${room.id}`)}
              className={`w-full text-left px-3 py-2 rounded-[calc(var(--radius)-2px)] text-sm transition-colors ${
                activeRoom?.id === room.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground text-foreground'
              }`}
            >
              <p className="font-medium truncate">{room.user.name}</p>
              <p className="text-xs truncate opacity-70">{room.messages[0]?.content ?? '메시지 없음'}</p>
            </button>
          ))
        )}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1">
        {!activeRoom ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground text-sm">
            왼쪽에서 상담방을 선택하세요.
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground mb-4">
              {activeRoom.user.name} 님과의 상담
            </h1>
            <div className="h-96 overflow-y-auto border border-border rounded-[var(--radius)] p-4 space-y-2 bg-card mb-4">
              {messages.map((msg, i) => (
                <div
                  key={msg.id ?? i}
                  className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <span className={`px-3 py-2 rounded-[calc(var(--radius)-2px)] text-sm ${
                    msg.senderRole === 'admin'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}>
                    {msg.content}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="답장을 입력하세요"
                className="flex-1 border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm bg-background"
              />
              <button
                onClick={send}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-[calc(var(--radius)-2px)] text-sm font-medium hover:opacity-90 transition-opacity"
              >
                전송
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

### 9단계 — `apps/web/src/app/admin/chat/page.tsx` 작성

> **주의**: `activeRoom` 조회 시 반드시 `user: true`를 include해야 한다.  
> 누락하면 `AdminChatWindow`에서 `activeRoom.user.name` 접근 시 `Cannot read properties of undefined` 오류가 발생한다.

```ts
// ❌ 잘못된 예 — user 누락
const activeRoom = roomId
  ? await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
  : null;

// ✅ 올바른 예
const activeRoom = roomId
  ? await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        user: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })
  : null;
```

```tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@my-project/database';
import AdminChatWindow from '@/features/chat/components/AdminChatWindow';

export default async function AdminChatPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/');

  const { roomId } = await searchParams;

  const rooms = await prisma.chatRoom.findMany({
    include: { user: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  const activeRoom = roomId
    ? await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null;

  return (
    <AdminChatWindow
      rooms={rooms}
      activeRoom={activeRoom}
      adminId={session.user.id}
    />
  );
}
```

---

### 10단계 — WebSocket 서버 시작 로그 추가

서버가 정상 실행됐는지 터미널에서 바로 확인할 수 있도록 `server.ts`에 로그를 추가한다.

```ts
server.listen(process.env.PORT ?? 3000, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`🔌 WebSocket 서버 실행 중: ws://localhost:${process.env.PORT ?? 3000}/ws`);
});
```

`pnpm dev` 실행 후 아래처럼 출력되면 정상이다.

```
✅ Redis 연결 성공 (localhost:6379)
✅ 서버 실행 중: http://localhost:3000
🔌 WebSocket 서버 실행 중: ws://localhost:3000/ws
```

---

### 11단계 — 다중 서버 시연 테스트

단일 PC에서 포트를 다르게 해 서버 2개를 띄워 Pub/Sub 효과를 확인한다.

```
터미널 A: PORT=3000 pnpm dev  ← 사용자 브라우저에서 접속
터미널 B: PORT=3001 pnpm dev  ← 상담원 브라우저에서 접속
Redis:    localhost:6379        ← 두 서버 간 메시지 중계
```

**테스트 준비**

브라우저 확장 프로그램(예: ENDIC 사전)이 설치된 경우 React Hydration 오류가 발생할 수 있다.
반드시 **시크릿 모드(InPrivate)**에서 테스트한다.

| 브라우저 | 시크릿 모드 단축키 |
|---|---|
| Chrome | `Ctrl+Shift+N` |
| Edge | `Ctrl+Shift+N` |

기존에 실행 중인 개발 서버가 있다면 먼저 `Ctrl+C`로 중지한다.  
3000번 포트가 사용 중인 상태에서 터미널 A를 실행하면 포트 충돌 오류가 발생한다.

터미널을 2개 열고 각각 다른 포트로 서버를 구동한다.

```cmd
# 터미널 A (사용자 서버)
set PORT=3000 && pnpm dev

# 터미널 B (상담원 서버)
set PORT=3001 && pnpm dev
```

**테스트 순서**

1. 브라우저 창 2개를 준비한다.
   - 창 1: `http://localhost:3000` — 사용자 서버
   - 창 2: `http://localhost:3001` — 상담원 서버

2. **창 1** (사용자 서버)에서 일반 계정으로 로그인 → `/chat` 접속

3. **창 2** (상담원 서버)에서 관리자 계정(`admin@test.com`)으로 로그인 → `/admin/chat` 접속

4. 창 1에서 메시지 전송 → 창 2 상담원 화면에 실시간으로 표시되는지 확인

5. 창 2에서 답장 전송 → 창 1 사용자 화면에 실시간으로 표시되는지 확인

**Redis 없을 때 비교 테스트**

```powershell
docker stop redis
```

Redis를 중지한 후 동일하게 메시지를 전송하면 서버 간 메시지가 전달되지 않는 것을 확인할 수 있다.  
이것이 다중 서버 환경에서 Redis Pub/Sub가 필요한 이유다.
