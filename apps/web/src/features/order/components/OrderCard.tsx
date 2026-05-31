'use client';

import { cancelOrder } from '@/features/order/order.actions';

const STATUS_LABELS: Record<string, string> = {
  PENDING: '결제대기',
  PAID: '결제완료',
  SHIPPING: '배송중',
  DONE: '배송완료',
  CANCELLED: '주문취소',
};

interface OrderItem {
  quantity: number;
  price: number;
  product: { name: string };
}

interface Order {
  id: string;
  createdAt: Date;
  totalPrice: number;
  statusCode: string;
  orderItems: OrderItem[];
}

export default function OrderCard({ order }: { order: Order }) {
  const canCancel = order.statusCode === 'PAID';
  const statusLabel = STATUS_LABELS[order.statusCode] ?? order.statusCode;

  return (
    <div className="bg-card border border-border rounded-[var(--radius)] p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString('ko-KR')}
        </p>
        <span className="text-sm font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-[calc(var(--radius)-4px)]">
          {statusLabel}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.orderItems.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-foreground">{item.product.name} × {item.quantity}</span>
            <span className="text-muted-foreground">{(item.price * item.quantity).toLocaleString()}원</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <p className="font-semibold text-foreground">합계: {order.totalPrice.toLocaleString()}원</p>
        {canCancel && (
          <form action={cancelOrder.bind(null, order.id)}>
            <button
              type="submit"
              className="text-sm text-destructive border border-destructive rounded-[calc(var(--radius)-2px)] px-3 py-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              주문 취소
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
