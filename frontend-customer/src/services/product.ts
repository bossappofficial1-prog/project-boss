import api from "@/lib/api";
import { ProductType } from "@/types";

export class Product {
    static async getAllByOutlet(outletId: string): Promise<ProductType[]> {
        return api.getData(`/products/outlet/${outletId}?accessed=PUBLIC`);
    }

    static async getDetail(productId: string): Promise<ProductType> {
        return api.getData(`/products/${productId}`);
    }
}