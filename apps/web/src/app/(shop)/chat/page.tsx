import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@my-project/database";
import ChatWindow from "@/features/chat/components/ChatWindow";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 채팅방 없으면 생성
  const room = await prisma.chatRoom.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <ChatWindow
      roomId={room.id}
      initialMessages={room.messages}
      userId={session.user.id}
    />
  );
}
