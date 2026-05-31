import { notFound } from 'next/navigation';
import { prisma } from '@my-project/database';
import ProductImage from '@/features/products/components/ProductImage';
import RecentTracker from '@/features/products/components/RecentTracker';
import ProductActions from '@/features/products/components/ProductActions';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) notFound();

  const productForClient = {
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
    stock: product.stock,
    createdAt: product.createdAt.toISOString(),
    categoryId: product.categoryId ?? undefined,
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug, sortOrder: product.category.sortOrder }
      : undefined,
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <RecentTracker product={productForClient} />

      {/* 상단: 이미지 + 정보/액션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 좌: 상품 이미지 */}
        <div className="aspect-square rounded-[var(--radius)] overflow-hidden border border-border">
          <ProductImage src={product.imageUrl} alt={product.name} />
        </div>

        {/* 우: 상품 정보 + 액션 */}
        <div className="flex flex-col gap-3">
          {product.category && (
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
          )}
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <p className="text-3xl font-bold text-primary mt-1">{product.price.toLocaleString()}원</p>

          <hr className="border-border my-2" />

          <ProductActions product={productForClient} />
        </div>
      </div>

      {/* 리뷰 섹션 */}
      <section className="mt-16">
        <h2 className="text-xl font-semibold text-foreground mb-4">리뷰</h2>
        <div className="border border-border rounded-[var(--radius)] p-10 text-center text-muted-foreground text-sm">
          아직 리뷰가 없습니다.
        </div>
      </section>

      {/* 상품 상세정보 섹션 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">상품 상세정보</h2>
        <div className="border border-border rounded-[var(--radius)] overflow-hidden">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full object-cover"
            />
          )}
          <div className="p-6">
            {product.description ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">상세 정보가 없습니다.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
