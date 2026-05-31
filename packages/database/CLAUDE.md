# CLAUDE.md — packages/database

## 주의사항

모든 `npx prisma` 명령은 반드시 **`packages/database/` 디렉토리에서** 실행해야 한다.
루트나 다른 경로에서 실행하면 `prisma.config.ts`를 찾지 못해 오류가 발생한다.

```bash
cd packages/database

npx prisma migrate dev --name <migration-name>   # 마이그레이션 생성 및 적용
npx prisma generate                              # Prisma Client 생성
npx prisma db seed                               # 시드 데이터 실행
npx prisma studio                                # GUI 데이터 브라우저
```

## ⚠️ 스키마 변경 후 필수 실행 순서

Prisma 7 이상에서는 `migrate dev`가 `generate`를 자동 실행하지 않는다.
반드시 아래 순서를 따른다.

```bash
# 스키마 변경 시 반드시 이 순서로 실행
npx prisma migrate dev --name <migration-name>   # 1. 마이그레이션 생성 및 적용
npx prisma generate                              # 2. Client 재생성 (필수! 자동 실행 안 됨)
npx prisma db seed                               # 3. 시드 실행
# Ctrl+C → pnpm dev                             # 4. dev 서버 재시작 (필수!)
```

### 왜 dev 서버를 재시작해야 하는가?

`packages/database/src/client.ts`는 PrismaClient를 `global`에 캐싱한다.

```ts
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- dev 서버 최초 실행 시 **구 PrismaClient**가 `global`에 저장된다
- `prisma generate`로 새 Client 파일이 생성되어도 이미 실행 중인 서버는 `global`의 **구 인스턴스를 계속 사용**한다
- 핫 리로드는 `global`을 초기화하지 않으므로 **서버 전체 재시작**이 필요하다

## prisma migrate reset 동작 방식

`prisma migrate reset`은 아래 3단계를 순서대로 실행한다.

```
1. 모든 테이블 삭제 (데이터 포함)
2. 마이그레이션 전체 재실행 (테이블 재생성)
3. seed.ts 자동 실행 (상품, 카테고리, SystemCode 재생성)
```

| 데이터 | 결과 |
|---|---|
| 상품, 카테고리, SystemCode | ✅ seed로 재생성 |
| 테스트 주문, 회원 계정 등 수동 생성 데이터 | ❌ 삭제됨 |

> `--force` 옵션은 데이터 보호가 아니라 **"삭제 확인 프롬프트를 건너뜀"** 을 의미한다.
> 직접 터미널에서 실행 시 `--force` 없이 실행하고 프롬프트에서 `y` 입력해도 동일하다.

---

## 🚨 DB 컬럼명 규칙 (절대 준수)

**모든 DB 컬럼명은 반드시 snake_case로 지정한다.**

PostgreSQL 표준이며, snake_case를 사용하지 않으면 Prisma가 컬럼명에 큰따옴표(`"`)를 강제로 붙인다.
큰따옴표가 붙은 컬럼명은 대소문자 구분이 생겨 SQL 쿼리 작성 시 혼란을 유발한다.

Prisma 모델 필드명은 camelCase를 유지하되, 반드시 `@map()`으로 snake_case DB 컬럼명을 명시한다.

```prisma
// ❌ 잘못된 예 — DB에 "imageUrl" (따옴표 강제)
imageUrl   String?

// ✅ 올바른 예 — DB에 image_url (따옴표 없음)
imageUrl   String? @map("image_url")
```

**`@map()` 적용 대상**: camelCase가 포함된 모든 필드.

| Prisma 필드 | DB 컬럼 (`@map`) |
|---|---|
| `productId` | `product_id` |
| `imageUrl` | `image_url` |
| `categoryId` | `category_id` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `receiverName` | `receiver_name` |
| `receiverPhone` | `receiver_phone` |
| `totalPrice` | `total_price` |
| `statusCode` | `status_code` |
| `groupCode` | `group_code` |
| `groupLabel` | `group_label` |
| `sortOrder` | `sort_order` |

---

## 스키마 변경 규칙

`prisma/schema.prisma` 변경은 **전체 팀에 영향**을 주므로 반드시 팀 합의 후 수정한다.
