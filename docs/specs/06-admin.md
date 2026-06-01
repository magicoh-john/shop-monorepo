# 스펙 06 — 관리자 백오피스

## 목표
관리자가 상품을 등록·수정·삭제하고, 전체 주문 상태를 관리할 수 있는 백오피스를 구현한다.

## 완료 기준
- `/admin` 대시보드에 전체 주문 수, 상품 수가 표시된다
- 상품 목록에서 상품을 등록·수정·삭제할 수 있다
- 주문 목록에서 주문 상태를 변경할 수 있다
- 관리자(role: admin)가 아니면 접근이 차단된다

---

## DB 스키마 변경

없음.

---

## 컨벤션 변경 사항 (v1 → v2)

| 항목 | 구버전 | 현재 |
|---|---|---|
| 주문 상태 저장 | `statusCodeId` (FK) | `statusCode` String 직접 저장 |
| 주문 상태 접근 | `order.status.code` (관계) | `order.statusCode` |
| 상품 카테고리 | `category` String | `categoryId` String (FK) |
| 상품 식별자 | 없음 | `productId` String (비즈니스 ID) |

---

## 생성/수정할 파일

| 파일 | 작업 |
|---|---|
| `src/schemas/product.schema.ts` | 수정 — categoryId, productId 반영 |
| `src/features/admin/admin.actions.ts` | 생성 — 상품 CRUD, 주문 상태 변경 |
| `src/features/admin/components/ProductForm.tsx` | 생성 |
| `src/features/admin/components/OrderTable.tsx` | 생성 |
| `src/app/admin/page.tsx` | 수정 — 대시보드 |

---

## 구현 순서

### 1. product.schema.ts 수정

```ts
import { z } from 'zod';

export const productSchema = z.object({
  productId: z.string().min(1, '상품 코드를 입력해주세요'),
  name: z.string().min(2, '상품명은 2자 이상 입력해주세요'),
  price: z.number().int().min(1, '가격은 1원 이상이어야 합니다'),
  stock: z.number().int().min(0, '재고는 0개 이상이어야 합니다'),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
```

### 2. admin.actions.ts 생성

```ts
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

// statusCode를 직접 문자열로 업데이트 (SystemCode 조회 불필요)
export async function updateOrderStatus(orderId: string, statusCode: string) {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: { statusCode },
  });
  revalidatePath('/admin');
}
```

### 3. OrderTable.tsx 생성

```tsx
'use client';

import { updateOrderStatus } from '@/features/admin/admin.actions';

const STATUS_OPTIONS = [
  { code: 'PENDING',   label: '결제대기' },
  { code: 'PAID',      label: '결제완료' },
  { code: 'SHIPPING',  label: '배송중' },
  { code: 'DONE',      label: '배송완료' },
  { code: 'CANCELLED', label: '주문취소' },
];

export default function OrderTable({ orders }: { orders: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="py-2 text-muted-foreground font-medium">주문일</th>
          <th className="py-2 text-muted-foreground font-medium">고객명</th>
          <th className="py-2 text-muted-foreground font-medium">금액</th>
          <th className="py-2 text-muted-foreground font-medium">상태</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className="border-b border-border">
            <td className="py-3">{new Date(order.createdAt).toLocaleDateString('ko-KR')}</td>
            <td className="py-3">{order.user.name}</td>
            <td className="py-3">{order.totalPrice.toLocaleString()}원</td>
            <td className="py-3">
              <form action={updateOrderStatus.bind(null, order.id, '')}>
                <select
                  name="statusCode"
                  defaultValue={order.statusCode}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  className="border border-input rounded-[calc(var(--radius)-4px)] px-2 py-1 text-xs"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.code} value={s.code}>{s.label}</option>
                  ))}
                </select>
              </form>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 4. ProductForm.tsx 생성

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@/schemas/product.schema';
import { createProduct, updateProduct } from '@/features/admin/admin.actions';
import type { Category } from '@my-project/types';

interface Props {
  defaultValues?: Partial<ProductFormData> & { id?: string };
  categories: Category[];
  onSuccess?: () => void;
}

export default function ProductForm({ defaultValues, categories, onSuccess }: Props) {
  const isEdit = !!defaultValues?.id;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const onSubmit = async (data: ProductFormData) => {
    if (isEdit && defaultValues?.id) {
      await updateProduct(defaultValues.id, data);
    } else {
      await createProduct(data);
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground">상품 코드 (productId)</label>
        <input {...register('productId')} className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm" placeholder="예: PROD-051" />
        {errors.productId && <p className="text-xs text-destructive mt-1">{errors.productId.message}</p>}
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">상품명</label>
        <input {...register('name')} className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">가격</label>
        <input type="number" {...register('price', { valueAsNumber: true })} className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm" />
        {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">재고</label>
        <input type="number" {...register('stock', { valueAsNumber: true })} className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm" />
        {errors.stock && <p className="text-xs text-destructive mt-1">{errors.stock.message}</p>}
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">카테고리</label>
        <select {...register('categoryId')} className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm">
          <option value="">선택 안함</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">설명</label>
        <input {...register('description')} className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">이미지 URL</label>
        <input {...register('imageUrl')} className="mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground py-2 rounded-[calc(var(--radius)-2px)] text-sm font-medium disabled:opacity-50">
        {isSubmitting ? '저장 중...' : isEdit ? '수정' : '등록'}
      </button>
    </form>
  );
}
```

### 5. /admin/page.tsx 수정

```tsx
import { prisma } from '@my-project/database';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import OrderTable from '@/features/admin/components/OrderTable';
import ProductForm from '@/features/admin/components/ProductForm';

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') redirect('/');

  const [orders, productCount, categories] = await Promise.all([
    prisma.order.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count(),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-8">관리자 대시보드</h1>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-card border border-border rounded-[var(--radius)] p-6">
          <p className="text-sm text-muted-foreground">전체 주문</p>
          <p className="text-3xl font-bold mt-1">{orders.length}</p>
        </div>
        <div className="bg-card border border-border rounded-[var(--radius)] p-6">
          <p className="text-sm text-muted-foreground">전체 상품</p>
          <p className="text-3xl font-bold mt-1">{productCount}</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">주문 관리</h2>
        <OrderTable orders={orders} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">상품 등록</h2>
        <div className="max-w-md">
          <ProductForm categories={categories as any} />
        </div>
      </section>
    </div>
  );
}
```
