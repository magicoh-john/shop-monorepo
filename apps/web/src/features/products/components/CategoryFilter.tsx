'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Category } from '@my-project/types';

interface Props {
  categories: Category[];
  selected?: string;
}

export default function CategoryFilter({ categories, selected }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    params.delete('cursor');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      <button
        type="button"
        onClick={() => handleSelect()}
        className={`px-4 py-1.5 rounded-[calc(var(--radius)-2px)] text-sm border transition-colors ${
          !selected
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background text-foreground border-border hover:bg-accent'
        }`}
      >
        전체
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => handleSelect(cat.slug)}
          className={`px-4 py-1.5 rounded-[calc(var(--radius)-2px)] text-sm border transition-colors ${
            selected === cat.slug
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-border hover:bg-accent'
          }`}
        >
          {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
          {cat.name}
        </button>
      ))}
    </div>
  );
}
