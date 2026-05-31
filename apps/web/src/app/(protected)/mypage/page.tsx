import { auth } from '@/auth';
import { prisma } from '@my-project/database';
import { redirect } from 'next/navigation';
import OrderCard from '@/features/order/components/OrderCard';

export default async function MyPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      orderItems: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-8">마이페이지</h1>

      <h2 className="text-lg font-semibold text-foreground mb-4">주문 내역</h2>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          주문 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
