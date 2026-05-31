'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@/schemas/product.schema';
import { createProduct, updateProduct } from '@/features/admin/admin.actions';

interface Category {
  id: string;
  name: string;
}

interface Props {
  defaultValues?: Partial<ProductFormData> & { id?: string };
  categories: Category[];
  onSuccess?: () => void;
}

export default function ProductForm({ defaultValues, categories, onSuccess }: Props) {
  const isEdit = !!defaultValues?.id;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const onSubmit = async (data: ProductFormData) => {
    if (isEdit && defaultValues?.id) {
      await updateProduct(defaultValues.id, data);
    } else {
      await createProduct(data);
      reset();
    }
    onSuccess?.();
  };

  const inputClass = 'mt-1 w-full border border-input rounded-[calc(var(--radius)-2px)] px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const labelClass = 'text-xs font-medium text-muted-foreground';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className={labelClass}>상품 코드 (productId)</label>
        <input {...register('productId')} placeholder="예: PROD-051" className={inputClass} />
        {errors.productId && <p className="text-xs text-destructive mt-1">{errors.productId.message}</p>}
      </div>
      <div>
        <label className={labelClass}>상품명</label>
        <input {...register('name')} className={inputClass} />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className={labelClass}>가격 (원)</label>
        <input type="number" {...register('price', { valueAsNumber: true })} className={inputClass} />
        {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
      </div>
      <div>
        <label className={labelClass}>재고</label>
        <input type="number" {...register('stock', { valueAsNumber: true })} className={inputClass} />
        {errors.stock && <p className="text-xs text-destructive mt-1">{errors.stock.message}</p>}
      </div>
      <div>
        <label className={labelClass}>카테고리</label>
        <select {...register('categoryId')} className={inputClass}>
          <option value="">선택 안함</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>설명</label>
        <input {...register('description')} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>이미지 URL</label>
        <input {...register('imageUrl')} className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground py-2 rounded-[calc(var(--radius)-2px)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? '저장 중...' : isEdit ? '수정' : '상품 등록'}
      </button>
    </form>
  );
}
