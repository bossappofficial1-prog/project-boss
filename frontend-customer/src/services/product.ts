import api from "@/lib/api";
import { Product as ProductType } from "@/types/product";

export class Product {
  static async getAllByOutlet(outletId: string): Promise<ProductType[]> {
    return api.getData(`/products/outlet/${outletId}?accessed=PUBLIC`);
  }

  static async getDetail(productId: string): Promise<ProductType> {
    return api.getData(`/products/${productId}`);
  }
}
