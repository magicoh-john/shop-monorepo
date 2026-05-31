'use client';

import { useEffect } from 'react';
import { useRecentStore } from '@/store/recentStore';
import type { Product } from '@my-project/types';

export default function RecentTracker({ product }: { product: Product }) {
  const addRecent = useRecentStore((state) => state.addRecent);

  useEffect(() => {
    addRecent(product);
  }, [product.id]);

  return null;
}
