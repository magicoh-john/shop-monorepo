# Redis 로컬 설치 및 환경 설정

## 0. Redis가 이미 실행 중인지 확인 (가장 먼저)

설치 전에 6379 포트가 이미 사용 중인지 확인합니다.

```powershell
netstat -ano | findstr :6379
```

결과가 출력되면 이미 Redis가 실행 중입니다. → **바로 3단계(연결 확인)로 이동**  
결과가 없으면 실행 중이지 않습니다. → **아래 순서대로 진행**

---

## 1. Docker Desktop 설치

[https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) 에서 본인 OS에 맞는 버전을 설치합니다.

설치 후 Docker Desktop을 실행해 고래 아이콘이 트레이에 나타나는지 확인합니다.

---

## 2. Redis 컨테이너 실행

```powershell
docker run -d --name redis -p 6379:6379 redis:latest
```

---

## 3. 연결 확인

```powershell
docker exec -it redis redis-cli ping
```

`PONG` 이 출력되면 정상입니다.

---

## 4. 프로젝트 환경 변수 설정

`apps/web/.env.local` 파일에 추가합니다.

```env
REDIS_URL=redis://localhost:6379
```

---

## 5. Redis 클라이언트 패키지 설치

```bash
pnpm add ioredis --filter web
```

---

## 6. 연결 유틸리티 작성

`apps/web/src/lib/redis.ts` 파일을 생성합니다.

```ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export default redis;
```

---

## 7. 서버 시작 시 Redis 연결 확인 로그 추가

`apps/web/src/instrumentation.ts` 파일을 생성합니다.

```ts
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
```

`instrumentation.ts`의 `register()` 함수는 **Next.js 서버가 시작될 때 자동으로 한 번 실행**됩니다.  
`process.env.NEXT_RUNTIME === 'nodejs'` 조건은 `ioredis`가 Node.js 환경에서만 동작하기 때문에 필요합니다.

---

## 8. 개발 서버 구동

Docker Redis 컨테이너가 실행 중인 상태에서 시작합니다.  
개발 서버가 이미 실행 중이라면 **반드시 재시작**해야 `.env.local`의 `REDIS_URL`이 적용됩니다.

```bash
# 실행 중인 서버가 있다면 Ctrl+C로 중지 후
pnpm dev
```

서버 시작 후 터미널에 아래 로그가 출력되면 Redis 연결이 완료된 것입니다.

```
✅ Redis 연결 성공 (localhost:6379)
```

Redis가 실행 중이지 않으면:

```
❌ Redis 연결 실패 — Docker Redis 컨테이너가 실행 중인지 확인하세요.
```

---

## 체크리스트

- [ ] Docker Desktop 실행 확인
- [ ] `docker exec -it redis redis-cli ping` → PONG 확인
- [ ] `.env.local`에 `REDIS_URL` 추가
- [ ] `ioredis` 패키지 설치
- [ ] `apps/web/src/lib/redis.ts` 생성
- [ ] `apps/web/src/instrumentation.ts` 생성
- [ ] `pnpm dev` 실행 후 `✅ Redis 연결 성공` 로그 확인
