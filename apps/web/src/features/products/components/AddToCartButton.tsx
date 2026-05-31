'use client';

import { useCartStore } from '@/store/cartStore';
import type { Product } from '@my-project/types';

export default function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl ?? undefined,
    });
    alert('장바구니에 추가되었습니다.');
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={product.stock === 0}
      className="w-full bg-primary text-primary-foreground py-3 rounded-[calc(var(--radius)-2px)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {product.stock === 0 ? '품절' : '장바구니 담기'}
    </button>
  );
}
