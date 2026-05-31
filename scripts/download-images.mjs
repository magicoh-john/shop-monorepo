/**
 * Picsum Photos에서 상품 이미지 50개를 다운로드합니다.
 * 저장 위치: apps/web/public/images/products/
 *
 * 실행 방법:
 *   node scripts/download-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../apps/web/public/images/products');
const TOTAL = 50;
const SIZE = 400;

// 출력 폴더 생성
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 폴더 생성: ${OUTPUT_DIR}`);
}

async function downloadImage(index) {
  const url = `https://picsum.photos/seed/product${index}/${SIZE}/${SIZE}`;
  const filename = `product${index}.jpg`;
  const filepath = path.join(OUTPUT_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.log(`⏭️  스킵 (이미 존재): ${filename}`);
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`✅ 다운로드 완료: ${filename}`);
  } catch (err) {
    console.error(`❌ 실패: ${filename} — ${err.message}`);
  }
}

async function main() {
  console.log(`🚀 이미지 ${TOTAL}개 다운로드 시작...\n`);

  // 동시 요청 과부하 방지를 위해 5개씩 묶어서 처리
  const BATCH = 5;
  for (let i = 1; i <= TOTAL; i += BATCH) {
    const batch = Array.from(
      { length: Math.min(BATCH, TOTAL - i + 1) },
      (_, j) => downloadImage(i + j)
    );
    await Promise.all(batch);
  }

  console.log(`\n🎉 완료! ${OUTPUT_DIR}`);
}

main();
