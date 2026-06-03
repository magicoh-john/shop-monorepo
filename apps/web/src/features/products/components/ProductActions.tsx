'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import type { Product } from '@my-project/types';

export default function ProductActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const addToCart = async () => {
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
        imageUrl: product.imageUrl ?? undefined,
      }),
    });
    router.refresh();
  };

  const handleAddToCart = async () => {
    await addToCart();
    alert('장바구니에 추가되었습니다.');
  };

  const handleOrder = async () => {
    await addToCart();
    router.push('/checkout');
  };

  const soldOut = product.stock === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-8">수량</span>
        <div className="flex items-center border border-border rounded-[calc(var(--radius)-2px)]">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-9 h-9 flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            disabled={soldOut || quantity >= product.stock}
            className="w-9 h-9 flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
          >
            +
          </button>
        </div>
        {!soldOut && (
          <span className="text-xs text-muted-foreground">재고 {product.stock}개</span>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <button
          type="button"
          onClick={handleOrder}
          disabled={soldOut}
          className="w-full bg-primary text-primary-foreground py-3 rounded-[calc(var(--radius)-2px)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {soldOut ? '품절' : '주문하기'}
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={soldOut}
          className="w-full border border-primary text-primary py-3 rounded-[calc(var(--radius)-2px)] font-semibold hover:bg-accent transition-colors disabled:opacity-50"
        >
          장바구니 담기
        </button>
        <button
          type="button"
          className="w-full border border-border text-foreground py-3 rounded-[calc(var(--radius)-2px)] font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
        >
          <Heart size={16} />
          찜하기
        </button>
      </div>
    </div>
  );
}
