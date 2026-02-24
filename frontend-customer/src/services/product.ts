import api from "@/lib/api";
import { Product as ProductType } from "@/types/product";

interface GetProductsByOutletParams {
  outletId: string;
  search?: string;
  type?: 'GOODS' | 'SERVICE';
  page?: number;
  limit?: number;
}

export class Product {
  static async getAllByOutlet(outletId: string): Promise<ProductType[]> {
    return api.getData(`/products/outlet/${outletId}?accessed=PUBLIC`);
  }

  static async searchByOutlet(params: GetProductsByOutletParams): Promise<{ data: ProductType[]; total: number }> {
    const { outletId, search, type, page = 1, limit = 100 } = params;
    const queryParams = new URLSearchParams({
      accessed: 'PUBLIC',
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) queryParams.append('q', search);
    if (type) queryParams.append('type', type);
    
    const response = await api.get(`/products/outlet/${outletId}?${queryParams.toString()}`);
    return {
      data: response.data.data || [],
      total: response.data.pagination?.total || 0
    };
  }

  static async getDetail(productId: string): Promise<ProductType> {
    return api.getData(`/products/${productId}`);
  }
}
