'use client';

import Link from 'next/link';
import { useRecentStore } from '@/store/recentStore';
import ProductImage from './ProductImage';

export default function RecentProducts() {
  const items = useRecentStore((state) => state.items);

  if (items.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-6 pb-6">
      <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 to-yellow-300" />
        <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-primary">개인 추천상품</h2>
            <p className="text-xs text-muted-foreground mt-0.5">최근 본 상품</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.slice(0, 8).map((product) => (
            <Link
              key={product.id}
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
              </div>
            </Link>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
