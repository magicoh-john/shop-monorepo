'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function CartIcon() {
  const totalCount = useCartStore((state) => state.totalCount());

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
