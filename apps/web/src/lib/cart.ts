import redis from './redis';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

const CART_TTL = 60 * 60 * 24 * 7; // 7일

export function buildCartKey(userId?: string | null, sessionId?: string | null): string {
  if (userId) return `cart:user:${userId}`;
  if (sessionId) return `cart:session:${sessionId}`;
  return '';
}

// redis에서 장바구니 데이터 가져오기
export async function getCart(key: string): Promise<CartItem[]> {
  if (!key) return [];
  const data = await redis.get(key);
  return data ? (JSON.parse(data) as CartItem[]) : [];
}

// 장바구니에 상품 추가 또는 수량 업데이트 -> redis에 저장
export async function setCart(key: string, items: CartItem[]): Promise<void> {
  await redis.set(key, JSON.stringify(items), 'EX', CART_TTL);
}

// 장바구니 비우기 -> redis에서 삭제
export async function clearCart(key: string): Promise<void> {
  await redis.del(key);
}
