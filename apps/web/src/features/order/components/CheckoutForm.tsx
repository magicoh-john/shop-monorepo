'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { orderSchema, type OrderFormData } from '@/schemas/order.schema';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/features/order/order.actions';

export default function CheckoutForm() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  });

  const onSubmit = async (data: OrderFormData) => {
    try {
      const orderItems = items.map(({ productId, quantity }) => ({ productId, quantity }));
      await createOrder(data, orderItems);
      clearCart();
      router.push('/mypage');
    } catch {
      alert('주문 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
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
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-10">

      {/* 주문 상품 목록 */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">주문 상품</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-3 bg-card border border-border rounded-[var(--radius)] p-3"
            >
              <div className="w-14 h-14 rounded-[calc(var(--radius)-2px)] overflow-hidden bg-muted shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.price.toLocaleString()}원 × {item.quantity}개
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground shrink-0">
                {(item.price * item.quantity).toLocaleString()}원
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-card border border-border rounded-[var(--radius)] p-4 flex justify-between items-center">
          <span className="font-semibold text-foreground">총 결제 금액</span>
          <span className="text-xl font-bold text-primary">{totalPrice().toLocaleString()}원</span>
        </div>
      </div>

      {/* 배송지 입력 */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">배송지 정보</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">받는 분 이름</label>
            <input
              {...register('receiverName')}
              className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {errors.receiverName && (
              <p className="text-xs text-destructive mt-1">{errors.receiverName.message}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">전화번호</label>
            <input
              {...register('receiverPhone')}
              placeholder="010-0000-0000"
              className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {errors.receiverPhone && (
              <p className="text-xs text-destructive mt-1">{errors.receiverPhone.message}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">배송지 주소</label>
            <input
              {...register('address')}
              className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {errors.address && (
              <p className="text-xs text-destructive mt-1">{errors.address.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 w-full bg-primary text-primary-foreground py-3 rounded-[calc(var(--radius)-2px)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? '처리 중...' : `${totalPrice().toLocaleString()}원 결제 완료`}
        </button>
      </div>
    </form>
  );
}
