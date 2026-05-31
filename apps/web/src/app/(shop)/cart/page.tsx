'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <p className="text-muted-foreground mb-4">장바구니가 비어있습니다.</p>
        <Link
          href="/products"
          className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-[calc(var(--radius)-2px)] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          상품 보러가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        장바구니 <span className="text-primary">{items.length}</span>
      </h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 bg-card border border-border rounded-[var(--radius)] p-4"
          >
            {/* 상품 이미지 */}
            <div className="w-16 h-16 rounded-[calc(var(--radius)-2px)] overflow-hidden bg-muted shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
              )}
            </div>

            {/* 상품 정보 */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{item.productName}</p>
              <p className="text-sm text-muted-foreground">{item.price.toLocaleString()}원</p>
            </div>

            {/* 수량 조절 */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                className="w-8 h-8 border border-border rounded-[calc(var(--radius)-4px)] flex items-center justify-center hover:bg-accent transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="w-8 h-8 border border-border rounded-[calc(var(--radius)-4px)] flex items-center justify-center hover:bg-accent transition-colors"
              >
                +
              </button>
            </div>

            {/* 소계 */}
            <p className="font-semibold text-foreground w-24 text-right shrink-0">
              {(item.price * item.quantity).toLocaleString()}원
            </p>

            {/* 삭제 */}
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="text-destructive text-sm hover:opacity-70 transition-opacity shrink-0"
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      {/* 합계 */}
      <div className="mt-6 bg-card border border-border rounded-[var(--radius)] p-4 flex items-center justify-between">
        <p className="text-lg font-bold text-foreground">총 합계</p>
        <p className="text-xl font-bold text-primary">{totalPrice().toLocaleString()}원</p>
      </div>

      <Link
        href="/checkout"
        className="mt-4 block w-full bg-primary text-primary-foreground py-3 rounded-[calc(var(--radius)-2px)] text-center font-semibold hover:opacity-90 transition-opacity"
      >
        주문하기 ({items.length}개 상품)
      </Link>
    </div>
  );
}
