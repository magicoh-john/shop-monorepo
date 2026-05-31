'use client';

import { useState } from 'react';

interface Props {
  src?: string | null;
  alt: string;
}

export default function ProductImage({ src, alt }: Props) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-muted">
        <span className="text-3xl">🛍️</span>
        <span className="text-xs text-muted-foreground">이미지 없음</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
}
