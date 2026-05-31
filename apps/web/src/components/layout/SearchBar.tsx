'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl">
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="상품명 또는 브랜드 입력"
        className="flex-1 px-4 py-2.5 text-sm text-foreground bg-background border border-border border-r-0 rounded-l-[calc(var(--radius)-2px)] focus:outline-none focus:border-primary"
      />
      <button
        type="submit"
        aria-label="검색"
        className="px-4 bg-primary text-primary-foreground rounded-r-[calc(var(--radius)-2px)] hover:opacity-90 transition-opacity flex items-center justify-center"
      >
        <Search size={18} />
      </button>
    </form>
  );
}
