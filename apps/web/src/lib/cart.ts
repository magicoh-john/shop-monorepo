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

export async function getCart(key: string): Promise<CartItem[]> {
  if (!key) return [];
  const data = await redis.get(key);
  return data ? (JSON.parse(data) as CartItem[]) : [];
}

export async function setCart(key: string, items: CartItem[]): Promise<void> {
  await redis.set(key, JSON.stringify(items), 'EX', CART_TTL);
}

export async function clearCart(key: string): Promise<void> {
  await redis.del(key);
}
