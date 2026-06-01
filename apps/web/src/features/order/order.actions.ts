'use server';

import { prisma } from '@my-project/database';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { orderSchema, type OrderFormData } from '@/schemas/order.schema';

interface OrderItemInput {
  productId: string;
  quantity: number;
}

export async function createOrder(formData: OrderFormData, items: OrderItemInput[]) {
  const session = await auth();
  if (!session) redirect('/login');

  const validated = orderSchema.safeParse(formData);
  if (!validated.success) throw new Error('입력값이 올바르지 않습니다.');

  for (const item of items) {
    if (item.quantity < 1 || item.quantity > 99) {
      throw new Error('수량은 1~99개 사이여야 합니다.');
    }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, price: true },
  });

  const priceMap = new Map(products.map((p) => [p.id, p.price]));

  for (const item of items) {
    if (!priceMap.has(item.productId)) {
      throw new Error(`존재하지 않는 상품입니다: ${item.productId}`);
    }
  }

  const totalPrice = items.reduce(
    (sum, item) => sum + priceMap.get(item.productId)! * item.quantity,
    0,
  );

  await prisma.order.create({
    data: {
      userId: session.user.id,
      statusCode: 'PAID',
      receiverName: validated.data.receiverName,
      receiverPhone: validated.data.receiverPhone,
      address: validated.data.address,
      totalPrice,
      orderItems: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: priceMap.get(item.productId)!,
        })),
      },
    },
  });
}

export async function cancelOrder(orderId: string) {
  const session = await auth();
  if (!session) redirect('/login');

  await prisma.order.updateMany({
    where: { id: orderId, userId: session.user.id },
    data: { statusCode: 'CANCELLED' },
  });

  revalidatePath('/mypage');
}
