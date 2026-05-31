import { prisma } from '@my-project/database';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import OrderTable from '@/features/admin/components/OrderTable';
import ProductForm from '@/features/admin/components/ProductForm';

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') redirect('/');

  const [orders, productCount, categories] = await Promise.all([
    prisma.order.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count(),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-8">관리자 대시보드</h1>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-card border border-border rounded-[var(--radius)] p-6">
          <p className="text-sm text-muted-foreground">전체 주문</p>
          <p className="text-3xl font-bold text-foreground mt-1">{orders.length}</p>
        </div>
        <div className="bg-card border border-border rounded-[var(--radius)] p-6">
          <p className="text-sm text-muted-foreground">전체 상품</p>
          <p className="text-3xl font-bold text-foreground mt-1">{productCount}</p>
        </div>
      </div>

      {/* 주문 관리 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">주문 관리</h2>
        <div className="bg-card border border-border rounded-[var(--radius)] p-6">
          <OrderTable orders={orders} />
        </div>
      </section>

      {/* 상품 등록 */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">상품 등록</h2>
        <div className="bg-card border border-border rounded-[var(--radius)] p-6 max-w-md">
          <ProductForm categories={categories} />
        </div>
      </section>
    </div>
  );
}
