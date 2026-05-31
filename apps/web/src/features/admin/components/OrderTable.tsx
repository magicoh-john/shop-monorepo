'use client';

import { updateOrderStatus } from '@/features/admin/admin.actions';

const STATUS_OPTIONS = [
  { code: 'PENDING',   label: '결제대기' },
  { code: 'PAID',      label: '결제완료' },
  { code: 'SHIPPING',  label: '배송중' },
  { code: 'DONE',      label: '배송완료' },
  { code: 'CANCELLED', label: '주문취소' },
];

interface Order {
  id: string;
  createdAt: Date;
  totalPrice: number;
  statusCode: string;
  user: { name: string };
}

export default function OrderTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">주문 내역이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-4 text-muted-foreground font-medium">주문일</th>
            <th className="py-2 pr-4 text-muted-foreground font-medium">고객명</th>
            <th className="py-2 pr-4 text-muted-foreground font-medium">금액</th>
            <th className="py-2 text-muted-foreground font-medium">상태</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border">
              <td className="py-3 pr-4 text-foreground">
                {new Date(order.createdAt).toLocaleDateString('ko-KR')}
              </td>
              <td className="py-3 pr-4 text-foreground">{order.user.name}</td>
              <td className="py-3 pr-4 text-foreground">{order.totalPrice.toLocaleString()}원</td>
              <td className="py-3">
                <select
                  defaultValue={order.statusCode}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  className="border border-input rounded-[calc(var(--radius)-4px)] px-2 py-1 text-xs bg-background text-foreground"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.code} value={s.code}>{s.label}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
