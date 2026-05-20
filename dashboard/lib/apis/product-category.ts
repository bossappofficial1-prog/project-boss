import { apiCall } from './base';

export interface ProductCategory {
  id: string;
  name: string;
  outletId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export const productCategoryApi = {
  listByOutlet: (outletId: string) =>
    apiCall<ProductCategory[]>(`/product-categories/outlet/${outletId}`),

  create: (data: { name: string; outletId: string }) =>
    apiCall<ProductCategory>('/product-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string }) =>
    apiCall<ProductCategory>(`/product-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<void>(`/product-categories/${id}`, {
      method: 'DELETE',
    }),
};
