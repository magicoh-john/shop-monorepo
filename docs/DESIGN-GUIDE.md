# DESIGN-GUIDE.md — 쇼핑몰 앱 디자인 일관성 가이드

**기반 디자인**: Inspire-React-main (호텔 리조트 UI)
**대상**: 팀원 A·B·C 전원
**목적**: 팀원이 서로 다른 화면을 개발해도 동일한 색상·폰트·간격을 사용하도록 규칙을 코드로 고정한다.

---

## 1. 결론 — 권장 방법

> **Design Token(Tailwind 설정 확장) + Storybook** 조합을 권장한다.

팀원 모두가 코드베이스에서 작업하는 환경에서는 "디자인 파일을 보고 값을 베껴 쓰는" 방식보다 **값 자체가 코드에 잠겨있는** 방식이 실수를 원천 차단한다.

| 방법 | 장점 | 단점 | 권장 대상 |
|------|------|------|-----------|
| Figma 이동 | 시각적으로 직관적, 비개발자 소통 용이 | 코드와 Figma 값이 따로 놀아 싱크 깨짐 | 디자이너·기획자가 있는 팀 |
| Stitch (Google) | AI 자동 디자인 생성, 빠른 목업 | 한국어 지원 미흡, 팀 협업 기능 부족 | 1인 또는 PoC 단계 |
| **Design Token + Tailwind** | 값이 코드에 고정 → 실수 불가능, 자동완성 지원 | 초기 설정 필요 | **코드 기반 협업 팀 (현재 우리 팀)** ✅ |

---

## 2. 방법별 상세 안내

### 방법 1 — Figma로 이동하는 방법

Figma는 현재 업계 표준 디자인 툴이지만, **개발자만 있는 팀에서는 관리 부담이 크다.**

#### 작업 순서

1. **Figma 무료 계정 생성** (figma.com)
2. **새 Design System 파일 생성**
3. **아래 토큰을 Figma Variables로 입력**

   Figma 좌측 패널 → Local variables → + 버튼으로 Color 그룹 생성:

   | Variable 이름 | 값 |
   |---|---|
   | `color/primary` | `#5A248D` |
   | `color/primary-hover` | `#A844FF` |
   | `color/accent` | `#E7AF1B` |
   | `color/accent-hover` | `#6F5C80` |
   | `color/text-primary` | `#111111` |
   | `color/text-secondary` | `#333333` |
   | `color/bg-footer` | `#E4E2DE` |

4. **컴포넌트 만들기**: Header, QuickBook 버튼, 카드, Footer를 각각 Frame으로 만들고 Auto Layout 적용
5. **팀 공유**: 파일 공유 링크 → 팀원 View 권한 부여

#### 한계

- Figma 값을 코드에 복사·붙여넣기할 때 오타 발생 가능
- 디자인이 바뀌면 Figma → 코드 양쪽을 모두 수정해야 함
- 무료 플랜은 동시 편집자 1명 제한

---

### 방법 2 — Stitch로 디자인 컨셉 도출하는 방법

Stitch는 Google Labs의 AI 기반 UI 생성 도구 (stitch.withgoogle.com)로, 텍스트 프롬프트나 이미지를 주면 Figma 컴포넌트를 자동 생성한다.

#### 작업 순서

1. **stitch.withgoogle.com** 접속
2. **스크린샷 업로드**: Inspire-React-main 빌드를 브라우저로 열고 화면 캡처
3. **프롬프트 입력** (영어 권장):

   ```
   Luxury shopping mall app inspired by a hotel resort.
   Primary color: deep purple #5A248D.
   Accent color: golden yellow #E7AF1B.
   Clean white background. Elegant sans-serif typography.
   Generate: header, product card, cart button, footer.
   ```

4. **생성된 컴포넌트를 Figma에 Export** (Stitch는 Figma 플러그인 제공)
5. **디자인 토큰 추출 → 코드에 반영**

#### 한계

- 생성 결과가 매번 달라 일관성 보장 어려움
- **완성도가 낮아 수동 수정 필요** (현재 실험적 도구)
- 영어 프롬프트만 원활히 지원
- 팀 협업 기능 없음 (개인 계정 기반)

---

### 방법 3 — Design Token + Tailwind 설정 확장 (권장) ✅

디자인 값을 `tailwind.config.ts`에 고정하면, **팀원 누구도 잘못된 색상을 쓸 수 없다.**

#### 원리

```
Inspire 코드에서 값 추출 → tailwind.config.ts에 등록 → 팀원이 클래스명으로만 사용
```

VS Code 자동완성이 `bg-primary`, `text-accent` 같은 이름을 제안하므로 색상 코드를 외울 필요도 없다.

#### 설정 방법

`apps/web/tailwind.config.ts`를 아래처럼 작성한다:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ── Primary (보라계열) ──────────────────────
        primary: {
          DEFAULT: '#5A248D',   // 로고, 강조 텍스트
          hover:   '#A844FF',   // 네비 hover
          muted:   '#6F5C80',   // offer 카테고리, 버튼 hover
        },
        // ── Accent (골드계열) ───────────────────────
        accent: {
          DEFAULT: '#E7AF1B',   // QuickBook 버튼, 슬라이드 카테고리
        },
        // ── Neutral ────────────────────────────────
        ink: {
          primary:   '#111111', // 본문 텍스트
          secondary: '#333333', // 보조 텍스트
        },
        surface: {
          footer: '#E4E2DE',    // 푸터 배경
        },
      },

      fontFamily: {
        // display: 로고, 대형 타이틀
        display: ['"Vitro-Inspire"', 'serif'],
        // body: 일반 텍스트
        body:    ['"Noto Sans"', 'sans-serif'],
      },

      letterSpacing: {
        logo: '2px',
        nav:  '3px',
        wide: '1px',
      },

      maxWidth: {
        // 전체 컨텐츠 최대 너비
        container: '1488px',
      },
    },
  },
  plugins: [],
};

export default config;
```

#### 사용 예시

```tsx
// ✅ 올바른 방법 — Tailwind 클래스 사용
<div className="text-primary font-display tracking-logo">INSPIRE</div>
<button className="bg-accent hover:bg-primary-muted text-white rounded-lg px-6 py-3">
  예약하기
</button>

// ❌ 잘못된 방법 — 하드코딩
<div style={{ color: '#5A248D' }}>INSPIRE</div>
```

---

## 3. Inspire 디자인에서 추출한 토큰 전체 목록

### 🎨 색상

| 용도 | 값 | Tailwind 클래스 |
|------|----|----|
| 로고·강조 | `#5A248D` (`rgb(90,36,141)`) | `text-primary`, `bg-primary` |
| 네비 hover | `#A844FF` (`rgb(168,68,255)`) | `hover:text-primary-hover` |
| 골드 버튼 | `#E7AF1B` | `bg-accent` |
| 버튼 hover | `#6F5C80` | `hover:bg-primary-muted` |
| 슬라이드 카테고리 | `#E6AF1B` | `text-accent` |
| 본문 텍스트 | `#111111` | `text-ink-primary` |
| 보조 텍스트 | `#333333` | `text-ink-secondary` |
| 배경 흰색 | `#FFFFFF` | `bg-white` |
| 푸터 배경 | `#E4E2DE` | `bg-surface-footer` |
| 슬라이드 오버레이 | `rgba(0,0,0,0.35)` | `bg-black/35` |

### 🔤 타이포그래피

| 용도 | 폰트 | 크기 | 굵기 | 자간 |
|------|------|------|------|------|
| 로고 | Vitro-Inspire | 32px | bold | 2px |
| 주요 네비 | Noto Sans | 18px | bold | 3px |
| 보조 메뉴 | Noto Sans | 14px | normal | — |
| 슬라이드 타이틀 | Noto Sans | 32px | bold | 2px |
| 슬라이드 요약 | Noto Sans | 18px | normal | 2px |
| 카드 타이틀 | Noto Sans | 24px | bold | 1px |
| 카드 카테고리 | Noto Sans | 16px | bold | 1px |
| 카드 요약 | Noto Sans | 18px | normal | — |
| 본문 | Noto Sans | 14px | normal | — |
| 기본 line-height | — | — | — | 1.6 |

### 📐 레이아웃·간격

| 항목 | 값 |
|------|-----|
| 컨텐츠 최대 너비 | `1488px` |
| 컨테이너 패딩 | `0 24px` |
| 헤더 높이 | 상단바 60px + 하단바 60px = 120px |
| 헤더 position | fixed, z-index: 1000 |
| 캐러셀 margin-top | 160px (헤더 높이 보상) |
| 푸터 margin-top | 160px |
| 섹션간 간격 | 컴포넌트별 상이, 최소 40px |

### 🔘 버튼 스타일

| 버튼 종류 | 배경 | 글자색 | border-radius | padding |
|-----------|------|--------|----------------|---------|
| QuickBook (예약) | `#E7AF1B` | white | 8px | 14px 24px |
| QuickBook hover | `#6F5C80` | white | 8px | — |
| 슬라이드 버튼 | `#E9E9E9` | `#111111` | 4px | 8px 90px |

---

## 4. 폰트 설정 방법

Vitro-Inspire 폰트 파일(`VITRO INSPIRE TTF.ttf`)을 프로젝트에 적용한다.

```
apps/web/public/fonts/VITRO_INSPIRE.ttf   ← 파일 복사
```

`apps/web/src/app/globals.css`에 추가:

```css
@font-face {
  font-family: 'Vitro-Inspire';
  src: url('/fonts/VITRO_INSPIRE.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

---

## 5. 컴포넌트 스타일 규칙

### 5-1. 카드 컴포넌트 (상품 카드, 오퍼 카드)

```tsx
// features/shared/ 에 공통 카드로 작성
<div className="bg-white rounded shadow-sm hover:shadow-md transition-shadow">
  <img className="w-full h-48 object-cover" />
  <div className="p-8">
    <span className="block text-primary-muted text-base font-bold tracking-wide">
      카테고리
    </span>
    <h3 className="text-2xl font-bold tracking-wide mt-0">타이틀</h3>
    <p className="text-lg text-ink-primary mt-3">요약 설명</p>
  </div>
</div>
```

### 5-2. 헤더 레이아웃

- 항상 `position: fixed`, `z-index: 1000`
- 두 줄 구조: 상단(로고 + CS메뉴), 하단(주요 네비)
- 컨텐츠 바로 아래 여백: 항상 `mt-40` (160px) 적용

### 5-3. 섹션 래퍼

```tsx
// 모든 섹션은 이 패턴 유지
<section className="max-w-container mx-auto px-6 py-10">
  ...
</section>
```

---

## 6. 팀원별 준수 규칙

| 규칙 | 내용 |
|------|------|
| ✅ | `tailwind.config.ts`에 정의된 이름만 사용 |
| ✅ | 색상 하드코딩 금지 (인라인 style, arbitrary value `[#5A248D]` 사용 금지) |
| ✅ | 공통 컴포넌트는 반드시 `features/shared/`에 작성, PR로 팀 합의 |
| ✅ | 새로운 색상이 필요하면 `tailwind.config.ts`에 먼저 추가하고 팀 채팅 공지 |
| ❌ | `style={{ color: '...' }}` 직접 작성 금지 |
| ❌ | Tailwind arbitrary value `bg-[#E7AF1B]` 방식으로 하드코딩 금지 |

---

## 7. Storybook으로 컴포넌트 문서화 (선택)

팀이 공통 컴포넌트를 많이 만들게 되면 Storybook 추가를 권장한다.

```bash
cd apps/web
npx storybook@latest init
```

각 공통 컴포넌트에 Story 파일을 추가하면, 브라우저에서 컴포넌트를 실제로 확인하며 개발할 수 있다. Figma 없이도 시각적 컴포넌트 카탈로그 역할을 한다.

---

## 8. 방법 최종 비교 요약

```
┌─ 방법 1: Figma
│   장점: 시각적, 비개발자 협업 가능
│   단점: 코드-디자인 싱크 관리 부담
│   → 디자이너가 있는 팀에 적합
│
├─ 방법 2: Stitch (Google AI)
│   장점: AI 자동 생성, 빠른 목업
│   단점: 실험적 도구, 팀 협업 미흡, 완성도 낮음
│   → 1인 빠른 프로토타이핑에만 사용
│
└─ 방법 3: Design Token + Tailwind ✅ 권장
    장점: 값이 코드에 고정 → 실수 불가능
          자동완성으로 토큰 이름만 치면 됨
          추가 도구 설치 불필요
    단점: 초기 config 설정 필요 (이미 위에서 완료)
    → 코드 중심 팀의 업계 표준 방법
```
