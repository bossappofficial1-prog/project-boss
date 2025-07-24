import { Product } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateProductInput, UpdateProductInput } from "../schemas/product.schema";

export class ProductRepository {
    static async create(data: CreateProductInput): Promise<Product> {
        return db.product.create({
            data,
        });
    }

    static async findById(id: string): Promise<Product | null> {
        return db.product.findUnique({
            where: { id },
            include: {
                bookingSlots: {
                    where: {
                        status: 'AVAILABLE',
                    },
                },
            },
        });
    }

    static async findByOutletId(outletId: string): Promise<Product[]> {
        return db.product.findMany({
            where: { outletId },
        });
    }

    static async update(id: string, data: UpdateProductInput): Promise<Product> {
        return db.product.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string): Promise<Product> {
        return db.product.delete({
            where: { id },
        });
    }

    static async searchByName(name: string): Promise<Product[]> {
        return db.product.findMany({
            where: {
                name: {
                    contains: name,
                    mode: 'insensitive', // Case-insensitive search
                },
            },
        });
    }
}