'use server';

import { prisma } from '@my-project/database';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { orderSchema, type OrderFormData } from '@/schemas/order.schema';

interface OrderItemInput {
  productId: string;
  price: number;
  quantity: number;
}

export async function createOrder(formData: OrderFormData, items: OrderItemInput[]) {
  const session = await auth();
  if (!session) redirect('/login');

  const validated = orderSchema.safeParse(formData);
  if (!validated.success) throw new Error('입력값이 올바르지 않습니다.');

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  await prisma.order.create({
    data: {
      userId: session.user.id,
      statusCode: 'PAID',
      receiverName: validated.data.receiverName,
      receiverPhone: validated.data.receiverPhone,
      address: validated.data.address,
      totalPrice,
      orderItems: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
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
