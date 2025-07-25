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

    static async findByOutletId(outletId: string, q?: string): Promise<Product[]> {
        const whereClause: any = { outletId };

        if (q) {
            whereClause.name = {
                contains: q,
                mode: 'insensitive',
            };
        }

        return db.product.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
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