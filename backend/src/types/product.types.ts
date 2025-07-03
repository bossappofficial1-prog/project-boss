import { ProductType } from "@prisma/client";

export interface UpdateProductInput {
    name?: string;
    description?: string;
    costPrice?: number;
    price?: number;
    type?: ProductType;
    quantity?: number;
    unit?: string;
    image?: string;
}

export interface CreateProductForOutletInput {
    name: string;
    description?: string;
    costPrice?: number;
    price: number;
    type: ProductType;
    quantity?: number;
    unit?: string;
    image?: string;
}