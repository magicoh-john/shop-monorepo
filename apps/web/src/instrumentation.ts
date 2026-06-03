export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const redis = (await import('./lib/redis')).default;
    try {
      await redis.ping();
      console.log('✅ Redis 연결 성공 (localhost:6379)');
    } catch {
      console.error('❌ Redis 연결 실패 — Docker Redis 컨테이너가 실행 중인지 확인하세요.');
    }
  }
}
