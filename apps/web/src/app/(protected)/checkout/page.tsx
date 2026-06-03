import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/cart';
import CheckoutForm from '@/features/order/components/CheckoutForm';

export default async function CheckoutPage() {
  const session = await auth();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('cart_session')?.value;

  const key = session?.user?.id
    ? `cart:user:${session.user.id}`
    : sessionId ? `cart:session:${sessionId}` : '';

  const items = await getCart(key);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-8">주문 / 결제</h1>
      <CheckoutForm initialItems={items} />
    </div>
  );
}
