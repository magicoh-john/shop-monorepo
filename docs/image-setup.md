# 상품 이미지 설정 가이드

팀별 아이템에 맞는 상품 이미지를 다운로드하고 프로젝트에 적용하는 방법을 설명한다.

---

## 1. 방법 비교

| 방법 | API 키 | 이미지 품질 | 카테고리 검색 | 추천 대상 |
|---|---|---|---|---|
| **Picsum Photos** | 불필요 | 랜덤 풍경/사물 | ❌ | 빠르게 시작하고 싶을 때 |
| **Unsplash API** | 필요 (무료) | 고품질 실제 상품 | ✅ | 팀 아이템과 관련된 이미지가 필요할 때 |
| **Pexels API** | 필요 (무료) | 고품질 실제 상품 | ✅ | Unsplash 대안 |

> **권장**: 팀 아이템이 명확한 경우 **Unsplash API** 사용. 빠른 프로토타입은 **Picsum**으로 시작해도 무방하다.

---

## 2. 방법 A — Picsum Photos (API 키 불필요)

이미지가 랜덤이라 아이템과 관련 없는 사진이 나올 수 있다. 프로토타입 단계에 적합하다.

### 실행 방법

```bash
# 프로젝트 루트에서
node scripts/download-images.mjs
```

`apps/web/public/images/products/product1.jpg` ~ `product50.jpg` 가 생성된다.

### 커스터마이징

`scripts/download-images.mjs`에서 `TOTAL` 값으로 다운로드 수를 조정할 수 있다.

```js
const TOTAL = 50;  // 원하는 개수로 변경
```

---

## 3. 방법 B — Unsplash API (카테고리별 실제 이미지)

### 3-1. API 키 발급

1. [https://unsplash.com/developers](https://unsplash.com/developers) 접속
2. 계정 생성 후 "New Application" 클릭
3. `Access Key` 발급 (무료, 시간당 50회 요청 가능)

### 3-2. 팀별 키워드 정의

팀 아이템에 맞는 키워드를 정한다.

| 팀 아이템 예시 | 추천 키워드 |
|---|---|
| 패션/의류 | `shirt`, `dress`, `fashion`, `clothing` |
| 식품/음식 | `food`, `fruit`, `vegetables`, `meal` |
| 가전/전자 | `electronics`, `laptop`, `smartphone` |
| 뷰티/화장품 | `cosmetics`, `skincare`, `makeup` |
| 스포츠 | `sports`, `fitness`, `gym`, `running` |
| 가구/인테리어 | `furniture`, `interior`, `home decor` |

### 3-3. 다운로드 스크립트

`scripts/download-images-unsplash.mjs` 파일을 아래와 같이 작성한다.

```js
/**
 * Unsplash API로 카테고리별 이미지를 다운로드합니다.
 *
 * 실행 방법:
 *   UNSPLASH_KEY=your_access_key node scripts/download-images-unsplash.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../apps/web/public/images/products');
const ACCESS_KEY = process.env.UNSPLASH_KEY;

if (!ACCESS_KEY) {
  console.error('❌ UNSPLASH_KEY 환경변수가 없습니다.');
  console.error('   실행 방법: UNSPLASH_KEY=your_key node scripts/download-images-unsplash.mjs');
  process.exit(1);
}

// ✏️ 팀 아이템에 맞게 키워드와 개수를 수정하세요
const CATEGORIES = [
  { keyword: 'shirt',    count: 10 },
  { keyword: 'pants',    count: 8  },
  { keyword: 'shoes',    count: 7  },
  { keyword: 'bag',      count: 6  },
  { keyword: 'jewelry',  count: 8  },
  { keyword: 'skincare', count: 5  },
  { keyword: 'fitness',  count: 6  },
];

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function fetchUnsplashImages(keyword, count) {
  const url = `https://api.unsplash.com/photos/random?query=${keyword}&count=${count}&orientation=squarish`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
  });
  if (!res.ok) throw new Error(`Unsplash API 오류: ${res.status}`);
  return res.json();
}

async function downloadImage(imageUrl, filepath) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`다운로드 실패: ${res.status}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

async function main() {
  console.log('🚀 Unsplash 이미지 다운로드 시작...\n');

  let index = 1;

  for (const { keyword, count } of CATEGORIES) {
    console.log(`\n📦 카테고리: ${keyword} (${count}개)`);
    try {
      const photos = await fetchUnsplashImages(keyword, count);
      for (const photo of photos) {
        const filepath = path.join(OUTPUT_DIR, `product${index}.jpg`);
        await downloadImage(photo.urls.regular, filepath);
        console.log(`  ✅ product${index}.jpg`);
        index++;
      }
    } catch (err) {
      console.error(`  ❌ ${keyword}: ${err.message}`);
    }

    // API 요청 제한 방지 (1초 대기)
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n🎉 완료! 총 ${index - 1}개 이미지 저장됨`);
  console.log(`   저장 위치: ${OUTPUT_DIR}`);
}

main();
```

### 3-4. 실행

```bash
# Windows PowerShell
$env:UNSPLASH_KEY="your_access_key"; node scripts/download-images-unsplash.mjs

# macOS / Linux
UNSPLASH_KEY=your_access_key node scripts/download-images-unsplash.mjs
```

---

## 4. seed.ts에 이미지 반영

이미지 다운로드 완료 후 `packages/database/prisma/seed.ts`에서 상품 데이터를 팀 아이템에 맞게 수정한다.

```ts
const img = (n: number) => `/images/products/product${n}.jpg`;

await prisma.product.createMany({
  data: [
    { name: "팀 아이템명", price: 00000, stock: 100, category: "카테고리", imageUrl: img(1) },
    // ...
  ],
  skipDuplicates: true,
});
```

수정 후 시드를 재실행한다.

```bash
cd packages/database
npx prisma db seed
```

---

## 5. 전체 실행 순서 요약

```
1. 키워드 정의        — 팀 아이템에 맞는 Unsplash 검색어 선정
2. 스크립트 수정      — CATEGORIES 배열에 키워드와 개수 입력
3. 이미지 다운로드    — node scripts/download-images-unsplash.mjs
4. seed.ts 수정       — 상품명, 가격, 카테고리, imageUrl 팀 아이템으로 교체
5. 시드 재실행        — npx prisma db seed
6. 개발 서버 확인     — pnpm dev
```
