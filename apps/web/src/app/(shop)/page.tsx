import Link from 'next/link';
import { prisma } from '@my-project/database';
import BannerSlider from '@/features/products/components/BannerSlider';
import ProductImage from '@/features/products/components/ProductImage';
import RecentProducts from '@/features/products/components/RecentProducts';
import ProductGrid from '@/features/products/components/ProductGrid';
import type { Product } from '@my-project/types';

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="rounded-[calc(var(--radius)-2px)] border border-border overflow-hidden hover:shadow-md transition-shadow bg-background"
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
  );
}

export default async function HomePage() {
  const [categories, newProducts, bestProducts] = await Promise.all([
    // 대카테고리
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
    }),
    // 신상품 — 최신 등록순 8개
    prisma.product.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    }),
    // 베스트상품 — 재고 적은 순 (주문 데이터 없을 경우 재고 기준 대체)
    prisma.product.findMany({
      take: 8,
      orderBy: { stock: 'asc' },
      include: { category: true },
    }),
  ]);

  return (
    <div className="bg-muted min-h-full">

      {/* 배너 슬라이더 */}
      <section className="w-full">
        <BannerSlider />
      </section>

      {/* 퀵 카테고리 — DB 대카테고리 기반 */}
      <section className="max-w-5xl mx-auto px-6 py-6">
        <div className="bg-card rounded-[var(--radius)] border border-border px-6 py-5">
          <div className="flex items-center justify-around">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-3xl">
                  {cat.emoji}
                </div>
                <span className="text-xs text-foreground text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 개인 추천상품 — 최근 본 상품 (없으면 숨김) */}
      <RecentProducts />

      {/* 신상품 */}
      <section className="max-w-5xl mx-auto px-6 pb-6">
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-blue-400" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">신상품</h2>
                <p className="text-xs text-muted-foreground mt-0.5">새로 들어온 상품</p>
              </div>
              <Link href="/products?sort=new" className="text-sm text-primary hover:opacity-80 font-medium">
                전체보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newProducts.map((p) => <ProductCard key={p.id} product={p as any} />)}
            </div>
          </div>
        </div>
      </section>

      {/* 베스트상품 */}
      <section className="max-w-5xl mx-auto px-6 pb-6">
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-destructive to-orange-400" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">베스트상품</h2>
                <p className="text-xs text-muted-foreground mt-0.5">가장 많이 팔린 상품</p>
              </div>
              <Link href="/products?sort=best" className="text-sm text-primary hover:opacity-80 font-medium">
                전체보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bestProducts.map((p) => <ProductCard key={p.id} product={p as any} />)}
            </div>
          </div>
        </div>
      </section>

      {/* 전체상품 — 무한 스크롤 */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-muted-foreground to-slate-400" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">전체상품</h2>
                <p className="text-xs text-muted-foreground mt-0.5">스크롤하면 더 보입니다</p>
              </div>
              <Link href="/products" className="text-sm text-primary hover:opacity-80 font-medium">
                상품 페이지 →
              </Link>
            </div>
            <ProductGrid />
          </div>
        </div>
      </section>

    </div>
  );
}
