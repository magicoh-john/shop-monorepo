import { prisma } from '@my-project/database';
import { NextRequest } from 'next/server';

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const categorySlug = searchParams.get('category') ?? undefined;
  const cursor = searchParams.get('cursor') ?? undefined;
  const keyword = searchParams.get('keyword') ?? undefined;

  // 카테고리 slug로 해당 카테고리 및 하위 카테고리 ID 조회
  let categoryIds: string[] | undefined;
  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: { children: true },
    });
    if (category) {
      categoryIds = category.children.length
        ? category.children.map((c) => c.id)
        : [category.id];
    }
  }

  const products = await prisma.product.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    where: {
      ...(categoryIds && { categoryId: { in: categoryIds } }),
      ...(keyword && {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const hasNextPage = products.length > PAGE_SIZE;
  const items = hasNextPage ? products.slice(0, PAGE_SIZE) : products;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return Response.json({ items, nextCursor });
}
