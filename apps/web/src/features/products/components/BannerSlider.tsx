'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './BannerSlider.module.css';

const BANNERS = [
  {
    label: "오늘만 이 가격",
    title: "오늘의 특가",
    desc: "최대 80% 할인",
    href: "/products",
    bgClass: styles.bgPurple,
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=300&fit=crop&auto=format",
  },
  {
    label: "NEW ARRIVALS",
    title: "신상품 입고",
    desc: "이번 주 새로운 트렌드",
    href: "/products",
    bgClass: styles.bgGreen,
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=300&h=300&fit=crop&auto=format",
  },
  {
    label: "BEST SELLERS",
    title: "베스트 상품",
    desc: "고객이 선택한 인기 상품",
    href: "/products",
    bgClass: styles.bgRed,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&auto=format",
  },
  {
    label: "SEASON SALE",
    title: "시즌 기획전",
    desc: "기간 한정 특별 할인",
    href: "/products",
    bgClass: styles.bgBlue,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop&auto=format",
  },
  {
    label: "MEMBERS ONLY",
    title: "멤버십 혜택",
    desc: "회원 전용 추가 10% 할인",
    href: "/login",
    bgClass: styles.bgDark,
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300&h=300&fit=crop&auto=format",
  },
];

const VISIBLE = 3;
const INTERVAL = 4000;

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const maxIndex = BANNERS.length - VISIBLE;

  const prev = useCallback(() => {
    setCurrent((c) => (c <= 0 ? maxIndex : c - 1));
  }, [maxIndex]);

  const next = useCallback(() => {
    setCurrent((c) => (c >= maxIndex ? 0 : c + 1));
  }, [maxIndex]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [paused, next]);

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ '--slide-offset': `${current * (100 / VISIBLE)}%`, transform: 'translateX(calc(var(--slide-offset) * -1))' } as React.CSSProperties}
      >
        {BANNERS.map((banner, i) => (
          <div key={i} className="w-1/3 shrink-0 px-1.5">
            <Link
              href={banner.href}
              className={`${banner.bgClass} relative flex overflow-hidden min-h-48 rounded-[var(--radius)] hover:opacity-90 transition-opacity`}
            >
              {/* 왼쪽: 텍스트 */}
              <div className="relative z-10 flex flex-col justify-center p-5 w-1/2">
                <p className="text-xs text-white/70 mb-1 font-medium tracking-wide">{banner.label}</p>
                <p className="text-xl font-bold text-white leading-tight">{banner.title}</p>
                <p className="text-sm text-white/80 mt-1">{banner.desc}</p>
              </div>

              {/* 오른쪽: 상품 이미지 */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  sizes="17vw"
                />
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* 이전 버튼 */}
      <button
        type="button"
        onClick={prev}
        aria-label="이전"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/40 hover:bg-background/70 rounded-full p-1.5 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      {/* 다음 버튼 */}
      <button
        type="button"
        onClick={next}
        aria-label="다음"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/40 hover:bg-background/70 rounded-full p-1.5 transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      {/* 하단 인디케이터 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`${i + 1}번 슬라이드`}
            className={`rounded-full transition-all duration-300 ${
              i === current ? 'w-5 h-1.5 bg-background' : 'w-1.5 h-1.5 bg-background/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
