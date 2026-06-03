import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/cart';

export default async function CartIcon() {
  const session = await auth();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('cart_session')?.value;

  const key = session?.user?.id
    ? `cart:user:${session.user.id}`
    : sessionId ? `cart:session:${sessionId}` : '';

  const items = await getCart(key);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Link
      href="/cart"
      className="flex flex-col items-center gap-0.5 text-foreground hover:text-primary transition-colors relative"
    >
      <div className="relative">
        <ShoppingCart size={22} />
        {totalCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </div>
      <span className="text-xs">장바구니</span>
    </Link>
  );
}
