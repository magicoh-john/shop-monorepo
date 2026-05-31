import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@my-project/database';
import ProductImage from '@/features/products/components/ProductImage';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!category) notFound();

  // 대카테고리면 하위 중카테고리 상품 전체 조회
  // 중카테고리면 해당 카테고리 상품만 조회
  const categoryIds = category.children.length
    ? category.children.map((c) => c.id)
    : [category.id];

  const products = await prisma.product.findMany({
    where: { categoryId: { in: categoryIds } },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* 카테고리 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground">홈</Link>
          <span>›</span>
          <span className="text-foreground">{category.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          {category.emoji && <span>{category.emoji}</span>}
          {category.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">총 {products.length}개 상품</p>
      </div>

      {/* 중카테고리 탭 (대카테고리인 경우) */}
      {category.children.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <Link
            href={`/categories/${category.slug}`}
            className="px-4 py-1.5 rounded-[calc(var(--radius)-2px)] text-sm bg-primary text-primary-foreground"
          >
            전체
          </Link>
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="px-4 py-1.5 rounded-[calc(var(--radius)-2px)] text-sm border border-border text-foreground hover:bg-accent transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* 상품 그리드 */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">이 카테고리에 상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="rounded-[calc(var(--radius)-2px)] border border-border overflow-hidden hover:shadow-md transition-shadow bg-card"
            >
              <div className="aspect-square overflow-hidden">
                <ProductImage src={product.imageUrl} alt={product.name} />
              </div>
              <div className="p-3">
                {product.category && (
                  <p className="text-xs text-muted-foreground">{product.category.name}</p>
                )}
                <p className="text-sm text-foreground font-medium mt-0.5 line-clamp-2">{product.name}</p>
                <p className="text-sm font-bold text-foreground mt-1">{product.price.toLocaleString()}원</p>
                <p className="text-xs text-muted-foreground mt-0.5">재고 {product.stock}개</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
