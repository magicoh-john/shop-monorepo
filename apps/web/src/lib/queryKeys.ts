export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params: { categorySlug?: string; cursor?: string }) =>
      ['products', 'list', params] as const,
    detail: (id: string) => ['products', id] as const,
    infinite: (params: { categorySlug?: string }) =>
      ['products', 'infinite', params] as const,
  },
  orders: {
    all: ['orders'] as const,
    byUser: (userId: string) => ['orders', userId] as const,
  },
  reviews: {
    byProduct: (productId: string) => ['reviews', productId] as const,
  },
} as const;
