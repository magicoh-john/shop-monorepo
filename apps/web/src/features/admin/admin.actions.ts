'use server';

import { prisma } from '@my-project/database';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { productSchema, type ProductFormData } from '@/schemas/product.schema';

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') redirect('/');
  return session;
}

export async function createProduct(data: ProductFormData) {
  await requireAdmin();
  const validated = productSchema.parse(data);
  await prisma.product.create({ data: validated });
  revalidatePath('/admin');
  revalidatePath('/products');
}

export async function updateProduct(id: string, data: ProductFormData) {
  await requireAdmin();
  const validated = productSchema.parse(data);
  await prisma.product.update({ where: { id }, data: validated });
  revalidatePath('/admin');
  revalidatePath('/products');
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath('/admin');
  revalidatePath('/products');
}

export async function updateOrderStatus(orderId: string, statusCode: string) {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: { statusCode },
  });
  revalidatePath('/admin');
}
