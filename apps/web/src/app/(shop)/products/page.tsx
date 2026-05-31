import { prisma } from '@my-project/database';
import ProductGrid from '@/features/products/components/ProductGrid';
import CategoryFilter from '@/features/products/components/CategoryFilter';

interface Props {
  searchParams: Promise<{ category?: string; keyword?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category, keyword } = await searchParams;

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {keyword ? `"${keyword}" 검색 결과` : '전체 상품'}
        </h1>
      </div>

      <CategoryFilter categories={categories as any} selected={category} />

      <ProductGrid categorySlug={category} keyword={keyword} />
    </div>
  );
}
