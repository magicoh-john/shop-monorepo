import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./src/lib/websocket";

// import { config } from "dotenv";
// config({ path: ".env.local" });

const app = next({ dev: process.env.NODE_ENV !== "production" });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // WebSocket 서버를 같은 HTTP 서버에 연결
  // const wss = new WebSocketServer({ server, path: "/ws" });
  // setupWebSocket(wss);
  // 수정
  const wss = new WebSocketServer({ noServer: true });
  setupWebSocket(wss);

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url!, "http://localhost").pathname;
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
    // /ws 외의 경로(/_next/webpack-hmr 등)는 Next.js가 처리
  });

  server.listen(process.env.PORT ?? 3000, () => {
    console.log(`서버 실행 중: http://localhost:${process.env.PORT ?? 3000}`);
  });
});
