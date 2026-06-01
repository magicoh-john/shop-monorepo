# 스펙 01-1 — 홈 페이지 디자인 (네이버 쇼핑 레이아웃 참고)

## 목표
네이버 쇼핑 메인 페이지 레이아웃을 참고하여 실제 쇼핑몰에 가까운 홈 페이지를 구현한다.

## 완료 기준
- Header가 2단 구조(로고+검색+아이콘 / 카테고리 탭)로 표시된다
- 프로모션 배너 3개가 가로로 나란히 표시된다
- 퀵 카테고리 아이콘 행이 표시된다
- 상품 큐레이션 그리드 섹션이 표시된다
- `design.md` 토큰 규칙을 준수한다 (하드코딩 색상 금지)

---

## 페이지 섹션 구조

```
┌─────────────────────────────────────────┐
│  Header 1행: 로고 + 검색창 + 아이콘      │
│  Header 2행: 카테고리 탭 네비게이션      │
├─────────────────────────────────────────┤
│  프로모션 배너 (3개 카드 가로 배치)      │
├─────────────────────────────────────────┤
│  퀵 카테고리 아이콘 행 (10개)            │
├─────────────────────────────────────────┤
│  상품 큐레이션 그리드                    │
│  (스펙 02 완료 후 실제 데이터 연결)      │
└─────────────────────────────────────────┘
```

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/app/globals.css` | 수정 — primary 색상 오렌지-레드 적용 |
| `src/components/layout/Header.tsx` | 수정 — 2단 구조로 재설계 |
| `src/components/layout/CategoryNav.tsx` | 생성 — 카테고리 탭 (클라이언트) |
| `src/components/layout/SearchBar.tsx` | 생성 — 검색창 (클라이언트) |
| `src/app/(shop)/page.tsx` | 수정 — 4섹션 홈 페이지 구현 |

---

## 구현 순서

### 1. globals.css — primary 색상 교체

```css
--color-primary: hsl(16 100% 50%);          /* #ff4800 오렌지-레드 */
--color-primary-foreground: hsl(0 0% 100%); /* 흰색 */
```

### 2. CategoryNav.tsx 생성 — 카테고리 탭

Header 2행에 들어가는 카테고리 탭. 현재 페이지 경로에 따라 활성 탭이 표시된다.

```tsx
// src/components/layout/CategoryNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CATEGORIES = [
  { label: '전체', href: '/products' },
  { label: '패션의류', href: '/categories/fashion' },
  { label: '신발', href: '/categories/shoes' },
  { label: '가방', href: '/categories/bag' },
  { label: '뷰티', href: '/categories/beauty' },
  { label: '식품', href: '/categories/food' },
  { label: '가전', href: '/categories/electronics' },
  { label: '스포츠', href: '/categories/sports' },
  { label: '홈리빙', href: '/categories/home' },
];

export default function CategoryNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-primary border-t border-primary-foreground/20">
      <div className="max-w-5xl mx-auto px-6">
        <ul className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isActive = pathname === cat.href;
            return (
              <li key={cat.href} className="shrink-0">
                <Link
                  href={cat.href}
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'text-primary-foreground font-semibold border-b-2 border-primary-foreground'
                      : 'text-primary-foreground/70 hover:text-primary-foreground'
                  }`}
                >
                  {cat.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
```

### 3. Header.tsx — 2단 구조로 재설계

```tsx
// src/components/layout/Header.tsx
import { auth } from "@/auth";
import { signOut } from "@/auth";
import Link from "next/link";
import SearchBar from "./SearchBar";
import CategoryNav from "./CategoryNav";

export default async function Header() {
  const session = await auth();

  return (
    <header>
      {/* 1행: 로고 + 검색 + 메뉴 */}
      <div className="bg-primary">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-primary-foreground shrink-0">
            ShopApp
          </Link>

          <SearchBar />

          <nav className="flex items-center gap-4 shrink-0">
            <Link href="/cart" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              장바구니
            </Link>
            {session ? (
              <>
                <Link href="/mypage" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  마이페이지
                </Link>
                {session.user.role === "admin" && (
                  <Link href="/admin" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                    관리자
                  </Link>
                )}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button type="submit" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                    로그아웃
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                로그인
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* 2행: 카테고리 탭 */}
      <CategoryNav />
    </header>
  );
}
```

### 4. (shop)/page.tsx — 4섹션 홈 페이지

```tsx
// src/app/(shop)/page.tsx
import Link from "next/link";

const BANNERS = [
  {
    title: "오늘의 특가",
    desc: "최대 80% 할인",
    href: "/products",
    bg: "bg-primary",
    text: "text-primary-foreground",
  },
  {
    title: "신상품 입고",
    desc: "이번 주 새로 들어온 상품",
    href: "/products",
    bg: "bg-secondary",
    text: "text-secondary-foreground",
  },
  {
    title: "베스트 상품",
    desc: "가장 많이 팔린 상품",
    href: "/products",
    bg: "bg-accent",
    text: "text-accent-foreground",
  },
];

const QUICK_CATEGORIES = [
  { label: "패션의류", emoji: "👕", href: "/categories/fashion" },
  { label: "신발", emoji: "👟", href: "/categories/shoes" },
  { label: "가방", emoji: "👜", href: "/categories/bag" },
  { label: "뷰티", emoji: "💄", href: "/categories/beauty" },
  { label: "식품", emoji: "🛒", href: "/categories/food" },
  { label: "가전", emoji: "📱", href: "/categories/electronics" },
  { label: "스포츠", emoji: "⚽", href: "/categories/sports" },
  { label: "홈리빙", emoji: "🏠", href: "/categories/home" },
  { label: "도서", emoji: "📚", href: "/categories/books" },
  { label: "반려동물", emoji: "🐾", href: "/categories/pets" },
];

export default function HomePage() {
  return (
    <div className="bg-muted min-h-full">

      {/* 섹션 1: 프로모션 배너 */}
      <section className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-4">
          {BANNERS.map((banner) => (
            <Link
              key={banner.title}
              href={banner.href}
              className={`${banner.bg} ${banner.text} rounded-[var(--radius)] p-6 flex flex-col justify-between min-h-32 hover:opacity-90 transition-opacity`}
            >
              <p className="text-xs font-medium opacity-70">{banner.desc}</p>
              <p className="text-xl font-bold">{banner.title}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 섹션 2: 퀵 카테고리 */}
      <section className="max-w-5xl mx-auto px-6 pb-6">
        <div className="bg-card rounded-[var(--radius)] border border-border px-6 py-4">
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {QUICK_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="flex flex-col items-center gap-1.5 py-3 rounded-[calc(var(--radius)-2px)] hover:bg-accent transition-colors"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs text-foreground text-center leading-tight">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 섹션 3: 상품 큐레이션 */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="bg-card rounded-[var(--radius)] border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">오늘의 추천 상품</h2>
              <p className="text-xs text-muted-foreground mt-0.5">당신을 위해 엄선한 상품</p>
            </div>
            <Link href="/products" className="text-sm text-primary hover:opacity-80 transition-opacity font-medium">
              전체보기 →
            </Link>
          </div>
          {/* 스펙 02 완료 후 실제 상품 데이터로 교체 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-[calc(var(--radius)-2px)] border border-border overflow-hidden">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">상품 이미지</span>
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground">브랜드명</p>
                  <p className="text-sm text-foreground font-medium mt-0.5 line-clamp-2">상품명이 들어갑니다</p>
                  <p className="text-xs text-destructive font-bold mt-1">20%</p>
                  <p className="text-sm font-bold text-foreground">29,900원</p>
                  <p className="text-xs text-muted-foreground line-through">37,000원</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
```

---

## 참고 — design.md 준수 사항

- 색상은 반드시 시맨틱 토큰만 사용 (`bg-primary`, `text-foreground` 등)
- 하드코딩 금지 (`bg-[#ff4800]` 사용 금지)
- 둥글기: `rounded-[var(--radius)]`, `rounded-[calc(var(--radius)-2px)]`만 사용
- 레이아웃: `max-w-5xl mx-auto px-6` 컨테이너 패턴 준수
