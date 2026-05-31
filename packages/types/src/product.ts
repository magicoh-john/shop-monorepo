export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
  parentId?: string;
  sortOrder: number;
  children?: Category[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  stock: number;
  createdAt: string;
  categoryId?: string;
  category?: Category;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
}
