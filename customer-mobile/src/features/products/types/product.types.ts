export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: ProductCategory;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}
