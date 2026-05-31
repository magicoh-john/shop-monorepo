import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const img = (n: number) => `/images/products/product${n}.jpg`;

async function main() {
  console.log("🌱 Seeding 시작...");

  // ── 0. 기존 데이터 초기화 ───────────────────────────
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.systemCode.deleteMany();
  console.log("🗑️  기존 데이터 초기화 완료");

  // ── 1. 공통코드 (주문상태) ───────────────────────────
  await prisma.systemCode.createMany({
    data: [
      { groupCode: "ORDER_STATUS", groupLabel: "주문상태", code: "PENDING", label: "결제대기", sortOrder: 1 },
      { groupCode: "ORDER_STATUS", groupLabel: "주문상태", code: "PAID", label: "결제완료", sortOrder: 2 },
      { groupCode: "ORDER_STATUS", groupLabel: "주문상태", code: "SHIPPING", label: "배송중", sortOrder: 3 },
      { groupCode: "ORDER_STATUS", groupLabel: "주문상태", code: "DONE", label: "배송완료", sortOrder: 4 },
      { groupCode: "ORDER_STATUS", groupLabel: "주문상태", code: "CANCELLED", label: "주문취소", sortOrder: 5 },
    ],
  });
  console.log("✅ 공통코드 삽입 완료");

  // ── 2. 대카테고리 5개 ────────────────────────────────
  const [fashion, shoesBags, accessories, beauty, sports] = await Promise.all([
    prisma.category.create({ data: { name: "패션의류", slug: "fashion", emoji: "👗", sortOrder: 1 } }),
    prisma.category.create({ data: { name: "신발/가방", slug: "shoes-bags", emoji: "👟", sortOrder: 2 } }),
    prisma.category.create({ data: { name: "액세서리", slug: "accessories", emoji: "💍", sortOrder: 3 } }),
    prisma.category.create({ data: { name: "뷰티", slug: "beauty", emoji: "💄", sortOrder: 4 } }),
    prisma.category.create({ data: { name: "스포츠", slug: "sports", emoji: "⚽", sortOrder: 5 } }),
  ]);
  console.log("✅ 대카테고리 5개 삽입 완료");

  // ── 3. 중카테고리 10개 ───────────────────────────────
  const [tops, bottoms, shoes, bags, jewelry, hats, skincare, makeup, equipment] = await Promise.all([
    prisma.category.create({ data: { name: "상의", slug: "tops", parentId: fashion.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: "하의", slug: "bottoms", parentId: fashion.id, sortOrder: 2 } }),
    prisma.category.create({ data: { name: "신발", slug: "shoes", parentId: shoesBags.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: "가방", slug: "bags", parentId: shoesBags.id, sortOrder: 2 } }),
    prisma.category.create({ data: { name: "주얼리", slug: "jewelry", parentId: accessories.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: "모자/스카프", slug: "hats", parentId: accessories.id, sortOrder: 2 } }),
    prisma.category.create({ data: { name: "스킨케어", slug: "skincare", parentId: beauty.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: "메이크업", slug: "makeup", parentId: beauty.id, sortOrder: 2 } }),
    prisma.category.create({ data: { name: "운동용품", slug: "equipment", parentId: sports.id, sortOrder: 1 } }),
  ]);
  console.log("✅ 중카테고리 9개 삽입 완료");

  // ── 4. 상품 50개 (categoryId 연결) ──────────────────
  await prisma.product.createMany({
    data: [
      // 상의 (10개)
      { productId: "PROD-001", name: "클래식 화이트 티셔츠", description: "어디서나 잘 어울리는 베이직 화이트 티셔츠", price: 29000, stock: 100, categoryId: tops.id, imageUrl: img(1) },
      { productId: "PROD-002", name: "오버핏 후드티", description: "루즈하게 입기 좋은 후드 스웨트셔츠", price: 49000, stock: 60, categoryId: tops.id, imageUrl: img(2) },
      { productId: "PROD-003", name: "울 가디건", description: "부드러운 울 혼방 소재의 가디건", price: 79000, stock: 45, categoryId: tops.id, imageUrl: img(3) },
      { productId: "PROD-004", name: "플리스 집업", description: "따뜻하고 가벼운 플리스 소재 집업", price: 65000, stock: 55, categoryId: tops.id, imageUrl: img(4) },
      { productId: "PROD-005", name: "스트라이프 셔츠", description: "깔끔한 스트라이프 패턴의 캐주얼 셔츠", price: 45000, stock: 70, categoryId: tops.id, imageUrl: img(5) },
      { productId: "PROD-006", name: "린넨 반팔 셔츠", description: "시원한 린넨 소재의 여름 셔츠", price: 39000, stock: 80, categoryId: tops.id, imageUrl: img(6) },
      { productId: "PROD-007", name: "터틀넥 니트", description: "따뜻한 터틀넥 울 니트", price: 69000, stock: 40, categoryId: tops.id, imageUrl: img(7) },
      { productId: "PROD-008", name: "맨투맨 스웨트셔츠", description: "데일리 베이직 맨투맨", price: 42000, stock: 90, categoryId: tops.id, imageUrl: img(8) },
      { productId: "PROD-009", name: "체크 플란넬 셔츠", description: "클래식 체크 패턴 플란넬 소재", price: 52000, stock: 50, categoryId: tops.id, imageUrl: img(9) },
      { productId: "PROD-010", name: "크롭 탱크탑", description: "여름철 시원한 크롭 탱크탑", price: 19000, stock: 120, categoryId: tops.id, imageUrl: img(10) },

      // 하의 (8개)
      { productId: "PROD-011", name: "슬림핏 청바지", description: "활동적인 데일리 슬림핏 청바지", price: 59000, stock: 80, categoryId: bottoms.id, imageUrl: img(11) },
      { productId: "PROD-012", name: "린넨 와이드 팬츠", description: "시원한 린넨 소재의 와이드 실루엣 팬츠", price: 55000, stock: 70, categoryId: bottoms.id, imageUrl: img(12) },
      { productId: "PROD-013", name: "카고 팬츠", description: "실용적인 포켓이 특징인 카고 팬츠", price: 62000, stock: 60, categoryId: bottoms.id, imageUrl: img(13) },
      { productId: "PROD-014", name: "코튼 반바지", description: "편안한 코튼 소재의 데일리 반바지", price: 32000, stock: 100, categoryId: bottoms.id, imageUrl: img(14) },
      { productId: "PROD-015", name: "슬랙스", description: "깔끔한 핏의 오피스 슬랙스", price: 68000, stock: 55, categoryId: bottoms.id, imageUrl: img(15) },
      { productId: "PROD-016", name: "레깅스", description: "신축성 좋은 운동용 레깅스", price: 35000, stock: 85, categoryId: bottoms.id, imageUrl: img(16) },
      { productId: "PROD-017", name: "미니 스커트", description: "트렌디한 플리츠 미니 스커트", price: 42000, stock: 65, categoryId: bottoms.id, imageUrl: img(17) },
      { productId: "PROD-018", name: "롱 플리츠 스커트", description: "우아한 실루엣의 롱 플리츠 스커트", price: 58000, stock: 45, categoryId: bottoms.id, imageUrl: img(18) },

      // 신발 (7개)
      { productId: "PROD-019", name: "캔버스 스니커즈", description: "가볍고 편안한 올데이 스니커즈", price: 69000, stock: 50, categoryId: shoes.id, imageUrl: img(19) },
      { productId: "PROD-020", name: "로퍼", description: "클래식한 디자인의 레더 로퍼", price: 89000, stock: 40, categoryId: shoes.id, imageUrl: img(20) },
      { productId: "PROD-021", name: "첼시 부츠", description: "세련된 첼시 부츠", price: 115000, stock: 30, categoryId: shoes.id, imageUrl: img(21) },
      { productId: "PROD-022", name: "러닝화", description: "쿠셔닝이 뛰어난 러닝 전용 운동화", price: 98000, stock: 55, categoryId: shoes.id, imageUrl: img(22) },
      { productId: "PROD-023", name: "슬립온", description: "편하게 신고 벗을 수 있는 슬립온", price: 45000, stock: 70, categoryId: shoes.id, imageUrl: img(23) },
      { productId: "PROD-024", name: "샌들", description: "여름철 시원한 스트랩 샌들", price: 38000, stock: 80, categoryId: shoes.id, imageUrl: img(24) },
      { productId: "PROD-025", name: "앵클 부츠", description: "데일리로 활용하기 좋은 앵클 부츠", price: 95000, stock: 35, categoryId: shoes.id, imageUrl: img(25) },

      // 가방 (6개)
      { productId: "PROD-026", name: "레더 미니백", description: "데일리로 활용하기 좋은 미니 크로스백", price: 89000, stock: 40, categoryId: bags.id, imageUrl: img(26) },
      { productId: "PROD-027", name: "캔버스 토트백", description: "가볍고 실용적인 캔버스 토트백", price: 45000, stock: 65, categoryId: bags.id, imageUrl: img(27) },
      { productId: "PROD-028", name: "백팩", description: "노트북 수납 가능한 데일리 백팩", price: 75000, stock: 50, categoryId: bags.id, imageUrl: img(28) },
      { productId: "PROD-029", name: "클러치백", description: "파티나 행사에 어울리는 클러치", price: 55000, stock: 35, categoryId: bags.id, imageUrl: img(29) },
      { productId: "PROD-030", name: "숄더백", description: "넉넉한 수납공간의 숄더백", price: 98000, stock: 30, categoryId: bags.id, imageUrl: img(30) },
      { productId: "PROD-031", name: "에코백", description: "친환경 소재의 가벼운 에코백", price: 18000, stock: 150, categoryId: bags.id, imageUrl: img(31) },

      // 주얼리 (4개)
      { productId: "PROD-032", name: "실버 체인 목걸이", description: "심플한 디자인의 실버 체인 목걸이", price: 35000, stock: 120, categoryId: jewelry.id, imageUrl: img(32) },
      { productId: "PROD-033", name: "골드 귀걸이", description: "데일리로 착용하기 좋은 골드 원형 귀걸이", price: 28000, stock: 100, categoryId: jewelry.id, imageUrl: img(33) },
      { productId: "PROD-034", name: "가죽 벨트", description: "클래식한 블랙 가죽 벨트", price: 32000, stock: 75, categoryId: jewelry.id, imageUrl: img(34) },
      { productId: "PROD-035", name: "손목시계", description: "미니멀한 디자인의 가죽 스트랩 시계", price: 125000, stock: 25, categoryId: jewelry.id, imageUrl: img(35) },

      // 모자/스카프 (4개)
      { productId: "PROD-036", name: "버킷햇", description: "자외선 차단에 좋은 면 소재 버킷햇", price: 25000, stock: 90, categoryId: hats.id, imageUrl: img(36) },
      { productId: "PROD-037", name: "울 비니", description: "따뜻한 울 소재 비니", price: 22000, stock: 110, categoryId: hats.id, imageUrl: img(37) },
      { productId: "PROD-038", name: "선글라스", description: "UV 차단 오버사이즈 선글라스", price: 48000, stock: 60, categoryId: hats.id, imageUrl: img(38) },
      { productId: "PROD-039", name: "스카프", description: "부드러운 실크 스카프", price: 55000, stock: 45, categoryId: hats.id, imageUrl: img(39) },

      // 스킨케어 (4개)
      { productId: "PROD-040", name: "수분 크림", description: "촉촉한 보습 수분 크림 50ml", price: 38000, stock: 200, categoryId: skincare.id, imageUrl: img(40) },
      { productId: "PROD-041", name: "선크림 SPF50+", description: "자외선 차단 지수 50+의 선크림", price: 28000, stock: 160, categoryId: skincare.id, imageUrl: img(41) },
      { productId: "PROD-042", name: "에센스 세럼", description: "피부 탄력을 위한 고농축 에센스", price: 65000, stock: 90, categoryId: skincare.id, imageUrl: img(42) },
      { productId: "PROD-043", name: "클렌징 폼", description: "순한 성분의 데일리 클렌징 폼", price: 18000, stock: 220, categoryId: skincare.id, imageUrl: img(43) },

      // 메이크업 (1개)
      { productId: "PROD-044", name: "립스틱", description: "발색 좋은 매트 립스틱", price: 22000, stock: 180, categoryId: makeup.id, imageUrl: img(44) },

      // 운동용품 (6개)
      { productId: "PROD-045", name: "요가 매트", description: "미끄럼 방지 TPE 요가 매트 6mm", price: 35000, stock: 80, categoryId: equipment.id, imageUrl: img(45) },
      { productId: "PROD-046", name: "덤벨 세트", description: "가정용 고무 코팅 덤벨 5kg 세트", price: 42000, stock: 60, categoryId: equipment.id, imageUrl: img(46) },
      { productId: "PROD-047", name: "운동용 장갑", description: "손목 보호대 내장 운동 장갑", price: 18000, stock: 120, categoryId: equipment.id, imageUrl: img(47) },
      { productId: "PROD-048", name: "스포츠 양말 5켤레", description: "발냄새 방지 기능성 스포츠 양말", price: 15000, stock: 200, categoryId: equipment.id, imageUrl: img(48) },
      { productId: "PROD-049", name: "폼롤러", description: "근육 이완을 위한 EPP 폼롤러", price: 28000, stock: 75, categoryId: equipment.id, imageUrl: img(49) },
      { productId: "PROD-050", name: "물통 1L", description: "BPA Free 트라이탄 스포츠 물통", price: 22000, stock: 150, categoryId: equipment.id, imageUrl: img(50) },
    ],
  });
  console.log("✅ 상품 50개 삽입 완료");

  console.log("🎉 Seeding 완료!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error("❌ Seeding 실패:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
