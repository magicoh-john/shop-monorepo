import { WebSocketServer, WebSocket } from "ws";
import { publisher, subscriber } from "./redisPubSub";
import { prisma } from "@my-project/database";

// roomId별 연결된 WebSocket 목록
const rooms = new Map<string, Set<WebSocket>>();

export function setupWebSocket(wss: WebSocketServer) {
  // Redis 메시지 수신 → 해당 채팅방 클라이언트에게 전달
  subscriber.on("message", (channel, message) => {
    const roomId = channel.replace("chat:", "");
    const clients = rooms.get(roomId);
    clients?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  wss.on("connection", (ws, req) => {
    const roomId = new URL(req.url!, "http://localhost").searchParams.get(
      "roomId",
    )!;

    // 채팅방 입장
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId)!.add(ws);
    subscriber.subscribe(`chat:${roomId}`);

    ws.on("message", async (data) => {
      const { senderId, senderRole, content } = JSON.parse(data.toString());

      // DB 저장
      await prisma.chatMessage.create({
        data: { roomId, senderId, senderRole, content },
      });

      // Redis 발행 → 같은 채널을 구독 중인 모든 서버로 전달
      await publisher.publish(
        `chat:${roomId}`,
        JSON.stringify({ senderId, senderRole, content }),
      );
    });

    ws.on("close", () => {
      rooms.get(roomId)?.delete(ws);
    });
  });
}
