"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
  const [messages, setMessages] = useState<Message[]>(
    activeRoom?.messages ?? [],
  );
  const [input, setInput] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!activeRoom) return;

    setMessages(activeRoom.messages);

    ws.current = new WebSocket(
      `ws://localhost:3000/ws?roomId=${activeRoom.id}`,
    );
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    return () => ws.current?.close();
  }, [activeRoom?.id]);

  const send = () => {
    if (!input.trim() || !activeRoom) return;
    ws.current?.send(
      JSON.stringify({
        senderId: adminId,
        senderRole: "admin",
        content: input,
      }),
    );
    setInput("");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex gap-6">
      {/* 채팅방 목록 */}
      <div className="w-64 shrink-0 border border-border rounded-[var(--radius)] bg-card p-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          상담 목록
        </h2>
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">상담 요청이 없습니다.</p>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => router.push(`/admin/chat?roomId=${room.id}`)}
              className={`w-full text-left px-3 py-2 rounded-[calc(var(--radius)-2px)] text-sm transition-colors ${
                activeRoom?.id === room.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground text-foreground"
              }`}
            >
              <p className="font-medium truncate">{room.user.name}</p>
              <p className="text-xs truncate opacity-70">
                {room.messages[0]?.content ?? "메시지 없음"}
              </p>
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
                  className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}
                >
                  <span
                    className={`px-3 py-2 rounded-[calc(var(--radius)-2px)] text-sm ${
                      msg.senderRole === "admin"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
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
