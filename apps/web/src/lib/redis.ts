import Redis from "ioredis"; // ioredis: Node.js용 Redis 클라이언트 라이브러리

// REDIS_URL(.env.local)을 읽어 Redis 서버에 연결한다.
// 싱글톤으로 export해 앱 전체에서 동일한 연결을 재사용한다.
const redis = new Redis(process.env.REDIS_URL!);

export default redis;
