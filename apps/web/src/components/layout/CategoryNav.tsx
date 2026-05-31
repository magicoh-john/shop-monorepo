import { prisma } from '@my-project/database';
import CategoryNavClient from './CategoryNavClient';

export default async function CategoryNav() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
  });

  return <CategoryNavClient categories={categories as any} />;
}
