import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@my-project/database";
import AdminChatWindow from "@/features/chat/components/AdminChatWindow";

export default async function AdminChatPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const { roomId } = await searchParams;

  const rooms = await prisma.chatRoom.findMany({
    include: {
      user: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const activeRoom = roomId
    ? await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: { user: true, messages: { orderBy: { createdAt: "asc" } } },
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
