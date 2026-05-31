# Design System — 쇼핑몰 앱

> **단일 진실 공급원(SSOT)**: 이 문서가 프로젝트의 유일한 디자인 표준이다.
> `DESIGN-GUIDE.md`와 `DESIGN-SYSTEM.md`는 이 문서로 대체된다.
> AI 및 팀원은 UI 작업 시 반드시 이 문서를 기준으로 한다.

---

## 1. 색상 시스템 (Color System)

Shadcn/ui의 시맨틱 토큰을 사용한다. 하드코딩된 Hex/RGB 값 사용을 금지한다.

### 1-1. 토큰 역할 정의

| 토큰 | 역할 | Tailwind 클래스 |
|:---|:---|:---|
| `background` | 앱 전체 최하단 배경 | `bg-background` |
| `foreground` | 기본 본문 텍스트 | `text-foreground` |
| `primary` | 주요 버튼, 브랜드 핵심 컬러 | `bg-primary text-primary-foreground` |
| `secondary` | 보조 버튼, 차분한 강조 요소 | `bg-secondary text-secondary-foreground` |
| `muted` | 비활성, 부연 설명, 덜 중요한 요소 | `bg-muted text-muted-foreground` |
| `accent` | 호버 상태, 리스트 아이템 선택 강조 | `hover:bg-accent hover:text-accent-foreground` |
| `destructive` | 삭제, 에러, 경고 | `bg-destructive text-destructive-foreground` |
| `border` | 테두리, 구분선 | `border-border` |
| `input` | 입력 필드 테두리 | `border-input` |
| `ring` | 포커스 링 | `focus-visible:ring-ring` |

### 1-2. CSS 변수 (globals.css에 적용)

> **커스터마이징**: `--primary` 값을 변경하면 앱 전체 브랜드 색상이 바뀐다.
> 현재는 Shadcn 기본값 사용. 브랜드 색상 확정 후 아래 값을 교체한다.

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

---

## 2. 타이포그래피 (Typography)

```css
font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont,
  "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

| 용도 | 클래스 조합 |
|---|---|
| 페이지 타이틀 | `text-3xl font-bold tracking-tight text-foreground` |
| 섹션 헤딩 | `text-xl font-semibold text-foreground` |
| 본문 | `text-sm text-foreground` |
| 보조 텍스트 | `text-sm text-muted-foreground` |
| 레이블 | `text-xs font-medium text-muted-foreground` |

---

## 3. 간격 & 레이아웃 (Spacing & Layout)

| 항목 | 값 | 클래스 |
|---|---|---|
| 컨텐츠 최대 너비 | `1280px` | `max-w-5xl mx-auto` |
| 컨테이너 패딩 | `0 24px` | `px-6` |
| 섹션 간격 | `40px` | `py-10` |
| 카드 내부 패딩 | `24px` | `p-6` |

---

## 4. 둥글기 규칙 (Border Radius)

`--radius: 0.5rem` 기준으로 상대 계산한다. 임의의 `rounded-xl`, `rounded-2xl` 사용을 금지한다.

| 요소 | 클래스 |
|---|---|
| Card, 대형 컨테이너 | `rounded-[var(--radius)]` |
| Button, Input | `rounded-[calc(var(--radius)-2px)]` |
| Badge, 소형 요소 | `rounded-[calc(var(--radius)-4px)]` |

---

## 5. 컴포넌트 패턴 (Component Patterns)

### 5-1. 페이지 래퍼

```tsx
<main className="min-h-screen bg-background">
  <div className="max-w-5xl mx-auto px-6 py-10">
    {/* 컨텐츠 */}
  </div>
</main>
```

### 5-2. 카드

```tsx
<div className="bg-card text-card-foreground rounded-[var(--radius)] border border-border shadow-sm p-6">
  {/* 카드 내용 */}
</div>
```

### 5-3. 섹션 헤딩

```tsx
<h2 className="text-xl font-semibold text-foreground mb-4">섹션 제목</h2>
```

### 5-4. 인터랙티브 리스트 아이템

```tsx
<div className="hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-[calc(var(--radius)-2px)] px-4 py-2 transition-colors">
  아이템
</div>
```

---

## 6. 금지 규칙 (Rules)

| ❌ 금지 | ✅ 대체 |
|---|---|
| `bg-blue-500`, `text-black` 하드코딩 | `bg-primary`, `text-foreground` |
| `style={{ color: '#5A248D' }}` | CSS 변수 또는 시맨틱 클래스 |
| `bg-[#E7AF1B]` arbitrary value | `--primary` 변수 수정 후 `bg-primary` |
| `rounded-xl`, `rounded-2xl` 임의 사용 | `rounded-[var(--radius)]` |
| `border-gray-200` 직접 지정 | `border-border` |

---

## 7. 브랜드 색상 커스터마이징 방법

브랜드 색상이 확정되면 `apps/web/src/app/globals.css`의 CSS 변수만 교체한다.
컴포넌트 코드는 전혀 수정할 필요가 없다.

1. `shadcn.com/themes` 에서 원하는 색상 팔레트 선택
2. 생성된 CSS 변수 코드 복사
3. `globals.css`의 `:root` 와 `.dark` 블록을 교체

```css
/* 예시: 보라 브랜드 적용 시 */
--primary: 279 58% 35%;         /* #5A248D */
--primary-foreground: 0 0% 100%;
```

---

## 8. AI 어시스턴트 지침

1. **임의 색상 금지**: `bg-blue-500`, `text-black`, `#FFFFFF` 하드코딩 사용 금지. 반드시 시맨틱 토큰(`bg-card`, `text-muted-foreground` 등)만 사용한다.
2. **테두리**: 테두리 추가 시 반드시 `border border-border` 또는 `border border-input`을 사용한다.
3. **호버 인터랙션**: `hover:bg-accent hover:text-accent-foreground` 패턴을 일관되게 적용한다.
4. **둥글기**: `rounded-[var(--radius)]` 기준을 지킨다. 임의 값 사용 금지.
5. **레이아웃**: 모든 페이지는 `max-w-5xl mx-auto px-6` 컨테이너 패턴을 따른다.
