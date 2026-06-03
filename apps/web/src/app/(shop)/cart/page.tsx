import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/cart';
import CartList from '@/features/cart/components/CartList';

export default async function CartPage() {
  const session = await auth();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('cart_session')?.value;

  const key = session?.user?.id
    ? `cart:user:${session.user.id}`
    : sessionId ? `cart:session:${sessionId}` : '';

  const items = await getCart(key);

  return <CartList initialItems={items} />;
}
