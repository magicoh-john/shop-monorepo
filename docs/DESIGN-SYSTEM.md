🎨 Design System Specification (shadcn/ui & Tailwind CSS)

본 문서는 AI 코딩 어시스턴트가 프로젝트 내에서 UI 컴포넌트를 생성, 수정, 리팩토링할 때 일관성을 유지하기 위한 디자인 시스템 명세서입니다. 모든 컴포넌트 개발 시 본 문서에 정의된 토큰과 규칙을 엄격히 준수해야 합니다.

---

## 📋 1. 시스템 색상 규칙 및 역할 정의 (Color Role Definitions)

shadcn/ui의 모든 색상은 시맨틱(Semantic) 이름을 사용합니다. 하드코딩된 Hex 색상 코드 대신 반드시 아래의 정의된 클래스를 사용해야 합니다.

| 토큰명 (Token) | 역할 및 사용 목적 (Role & Usage) | 적용 예시 (Tailwind Classes) |
| :--- | :--- | :--- |
| **background** | 애플리케이션의 최하단 전체 배경색 | `bg-background` |
| **foreground** | 기본 배경 위에 올라가는 표준 본문 텍스트 색상 | `text-foreground` |
| **primary** | 주요 단추(Button), 강조 요소, 브랜드 핵심 컬러 | `bg-primary text-primary-foreground` |
| **secondary** | 보조적인 단추, 배경과 대비를 줄인 차분한 강조 요소 | `bg-secondary text-secondary-foreground` |
| **muted** | 비활성화 상태, 부연 설명, 덜 중요한 텍스트나 배경 | `bg-muted text-muted-foreground` |
| **accent** | 마우스 호버(Hover) 상태나 리스트 아이템 선택 시 강조 색상 | `hover:bg-accent hover:text-accent-foreground` |
| **destructive** | 삭제, 에러, 경고 등 위험한 행동을 나타내는 컬러 | `bg-destructive text-destructive-foreground` |
| **border** | 컴포넌트의 테두리, 구분선(Separator) 등에 사용 | `border-border` |
| **input** | 입력 필드(Input, Select, Textarea)의 기본 테두리 색상 | `border-input` |
| **ring** | 포커스(Focus) 상태일 때 외곽에 생기는 링(Ring)의 색상 | `focus-visible:ring-ring` |

---

## 🌓 2. 테마별 변수 매핑 테이블 (Theme Mapping Table)

각 모드별 HSL 값의 매핑 관계입니다. 테마 변경 시 유기적으로 전환되도록 설계되었습니다.

| 세부 토큰 (Token Group) | 라이트 모드 변수값 (Light Mode) | 다크 모드 변수값 (Dark Mode) |
| :--- | :--- | :--- |
| **기본 배경 및 텍스트** | `--background: 0 0% 100%`<br>`--foreground: 222.2 84% 4.9%` | `--background: 222.2 84% 4.9%`<br>`--foreground: 210 40% 98%` |
| **카드 및 팝업 (Card & Popover)** | `--card: 0 0% 100%`<br>`--card-foreground: 222.2 84% 4.9%`<br>`--popover: 0 0% 100%`<br>`--popover-foreground: 222.2 84% 4.9%` | `--card: 222.2 84% 4.9%`<br>`--card-foreground: 210 40% 98%`<br>`--popover: 222.2 84% 4.9%`<br>`--popover-foreground: 210 40% 98%` |
| **기본 핵심 변수 (Core Specs)** | `--primary: 222.2 47.4% 11.2%`<br>`--primary-foreground: 210 40% 98%`<br>`--secondary: 210 40% 96.1%`<br>`--secondary-foreground: 222.2 47.4% 11.2%` | `--primary: 210 40% 98%`<br>`--primary-foreground: 222.2 47.4% 11.2%`<br>`--secondary: 217.2 32.6% 17.5%`<br>`--secondary-foreground: 210 40% 98%` |
| **상태 및 피드백 (State Tokens)** | `--muted: 210 40% 96.1%`<br>`--muted-foreground: 215.4 16.3% 46.9%`<br>`--accent: 210 40% 96.1%`<br>`--accent-foreground: 222.2 47.4% 11.2%`<br>`--destructive: 0 84.2% 60.2%`<br>`--destructive-foreground: 210 40% 98%` | `--muted: 217.2 32.6% 17.5%`<br>`--muted-foreground: 215 20.2% 65.1%`<br>`--accent: 217.2 32.6% 17.5%`<br>`--accent-foreground: 210 40% 98%`<br>`--destructive: 0 62.8% 30.6%`<br>`--destructive-foreground: 210 40% 98%` |
| **인터페이스 외곽선 (UI Line Specs)** | `--border: 214.3 31.8% 91.4%`<br>`--input: 214.3 31.8% 91.4%`<br>`--ring: 222.2 84% 4.9%` | `--border: 217.2 32.6% 17.5%`<br>`--input: 217.2 32.6% 17.5%`<br>`--ring: 212.7 26.8% 83.9%` |

---

## 📐 3. 컴포넌트 반경 및 타이포그래피 규칙 (Radius & Typography)

### 3.1. 둥글기 규칙 (Border Radius)
애플리케이션 내 모든 UI 요소의 곡률은 `--radius` 변수를 기준으로 상대 계산됩니다. 임의의 `rounded-xl`, `rounded-2xl` 사용을 금지합니다.

* `--radius` 기본값: `0.5rem` (`8px`)
* **Card, 대형 컨테이너**: `rounded-[var(--radius)]` 적용
* **Button, Input, 중간 요소**: `rounded-[calc(var(--radius)-2px)]` 적용
* **Dropdown, Popover, 소형 요소**: `rounded-[calc(var(--radius)-4px)]` 적용

### 3.2. 타이포그래피 시스템 (Typography Setup)
프로젝트는 Vercel Geist 폰트 프리셋을 기본으로 사용하며, 가독성과 명확한 계층 구조를 보장해야 합니다.

```css
/* 기본 폰트 패밀리 구성 선언 */
font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;


CSS 및 전역 스타일 선언부 명세 (Global Stylesheet)
프로젝트의 globals.css 파일에 선언된 최상위 표준 사양 코드입니다.
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

—----------
🤖 AI 어시스턴트 지침 (Instruction for AI)
임의 색상 지정 금지: 클래스 내에 bg-blue-500, text-black, #FFFFFF 같은 하드코딩 수치를 사용하지 마십시오. 반드시 상단에 정의된 시맨틱 토큰 조합(bg-card, text-card-foreground 등)만 사용하십시오.
테두리 설정: 테두리를 추가할 때는 반드시 border border-input 또는 border border-border를 명시하여 테마에 맞는 색상이 반영되게 하십시오.
인터랙션 피드백: 클릭 가능하거나 호버 상태가 필요한 컴포넌트는 명세서의 규칙대로 hover:bg-accent hover:text-accent-foreground 패턴을 일관되게 적용하십시오.
