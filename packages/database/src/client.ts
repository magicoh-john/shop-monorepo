import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. pg 커넥션 풀 생성 — DATABASE_URL로 PostgreSQL에 연결
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. 어댑터 생성 — pg 풀을 Prisma가 사용할 수 있도록 연결
const adapter = new PrismaPg(pool);

// 3. 개발 환경에서 핫 리로드 시 중복 연결 방지를 위해 global에 캐싱
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 4. PrismaClient 싱글턴 — 이미 생성된 인스턴스가 있으면 재사용
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
