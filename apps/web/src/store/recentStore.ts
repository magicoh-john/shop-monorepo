import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@my-project/types';

interface RecentStore {
  items: Product[];
  addRecent: (product: Product) => void;
  clear: () => void;
}

export const useRecentStore = create<RecentStore>()(
  persist(
    (set) => ({
      items: [],
      addRecent: (product) =>
        set((state) => ({
          items: [product, ...state.items.filter((i) => i.id !== product.id)].slice(0, 10),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'recent-storage' }
  )
);
