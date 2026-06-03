import Redis from "ioredis";

// 발행(PUBLISH)용
export const publisher = new Redis(process.env.REDIS_URL!);

// 구독(SUBSCRIBE)용 — 이 연결은 subscribe 전용으로만 사용
export const subscriber = new Redis(process.env.REDIS_URL!);
