'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Category } from '@my-project/types';

export default function CategoryNavClient({ categories }: { categories: Category[] }) {
  const pathname = usePathname();

  return (
    <nav className="bg-background border-t border-border">
      <div className="max-w-5xl mx-auto px-6">
        <ul className="flex items-center overflow-x-auto">
          <li className="shrink-0">
            <Link
              href="/"
              className={`block px-4 py-2.5 text-sm transition-colors border-b-2 ${
                pathname === '/'
                  ? 'text-primary font-semibold border-primary'
                  : 'text-foreground hover:text-primary border-transparent'
              }`}
            >
              홈
            </Link>
          </li>
          <li className="shrink-0">
            <Link
              href="/products"
              className={`block px-4 py-2.5 text-sm transition-colors border-b-2 ${
                pathname === '/products'
                  ? 'text-primary font-semibold border-primary'
                  : 'text-foreground hover:text-primary border-transparent'
              }`}
            >
              전체상품
            </Link>
          </li>
          {categories.map((cat) => {
            const isActive = pathname === `/categories/${cat.slug}`;
            return (
              <li key={cat.id} className="shrink-0">
                <Link
                  href={`/categories/${cat.slug}`}
                  className={`block px-4 py-2.5 text-sm transition-colors border-b-2 ${
                    isActive
                      ? 'text-primary font-semibold border-primary'
                      : 'text-foreground hover:text-primary border-transparent'
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
