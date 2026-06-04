# 채팅 기능 — 발견된 문제 및 조치 사항

## 문제 1 — 관리자가 방을 선택하기 전까지 메시지 수신 불가

**✅ 조치 완료**

### 현상
일반 사용자가 `/chat`에서 메시지를 보내도 관리자 화면에 도달하지 않는다.

### 원인 (수정 전 코드)
`AdminChatWindow`는 `activeRoom`이 있을 때만 WebSocket을 연결했다.  
관리자가 `/admin/chat`에 접속해도 방을 직접 클릭하기 전까지 WebSocket 연결이 없었다.

```tsx
// 수정 전
useEffect(() => {
  if (!activeRoom) return; // ← 방 미선택 시 WebSocket 연결 안 됨
  ws.current = new WebSocket(`ws://...?roomId=${activeRoom.id}`);
}, [activeRoom?.id]);
```

### 조치 내용
- **방법 A (자동 선택)** 적용: `admin/chat/page.tsx`에서 `roomId`가 없으면 가장 최근 방을 자동으로 `activeRoom`으로 설정
- **방법 B (실시간 알림 WebSocket)** 적용: `websocket.ts`에 `admin:notifications` 채널 추가, `AdminChatWindow`에 알림 전용 WebSocket(`?type=admin`) 마운트 시 연결

---

## 문제 2 — 관리자 방 목록이 실시간으로 갱신되지 않음

**✅ 조치 완료**

### 현상
관리자가 `/admin/chat` 페이지를 열어둔 상태에서 사용자가 처음 대화를 시작하면,  
방 목록에 해당 방이 나타나지 않는다. 새로고침해야 보인다.

### 원인
방 목록은 서버 렌더링 시점에 한 번만 조회된다.  
이후 새로 생성된 `ChatRoom`은 클라이언트에 반영되지 않는다.

### 조치 내용
알림 WebSocket(`?type=admin`)이 목록에 없는 방의 메시지를 수신하면  
`router.refresh()`를 호출해 서버에서 최신 방 목록을 다시 조회한다.

---

## 문제 3 — 선택하지 않은 방의 신규 메시지 알림 없음

**✅ 조치 완료**

### 현상
관리자가 A 방을 보고 있는 동안 B 방에 새 메시지가 와도 알 수 없다.

### 원인
선택된 방의 WebSocket만 연결되어 있어 다른 방의 메시지를 감지하는 구조가 없었다.

### 조치 내용
- `websocket.ts`: 메시지 발행 시 `chat:{roomId}`와 함께 `admin:notifications` 채널에도 동시 발행
- `AdminChatWindow`: 알림 WebSocket이 현재 열린 방 외의 메시지를 수신하면 해당 방 버튼에 미읽음 뱃지(숫자) 표시, 방 클릭 시 뱃지 초기화
