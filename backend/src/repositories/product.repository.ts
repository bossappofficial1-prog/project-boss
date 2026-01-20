import { Product, Prisma, UserRole, ProductType } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateProductInput, UpdateProductInput } from "../schemas/product.schema";

export class ProductRepository {
    static async findManyByIds(ids: string[]): Promise<Product[]> {
        return db.product.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
    }
    static async create(data: CreateProductInput): Promise<Product> {
        // Destructure capacity and the rest of the fields
        const { capacity, ...rest } = data as any;
        return db.product.create({
            data: {
                ...rest,
                // ...(data.type === 'SERVICE' && data.serviceDurationMinutes && {
                //     capacity: {
                //         create: {
                //             maxParallel: capacity && capacity > 0 ? capacity : 1
                //         }
                //     }
                // }),
                // ...(capacity !== undefined
                //     ? {
                //         serviceCapacity: {
                //             create: { value: capacity }
                //         }
                //     }
                //     : {}),
            },
        });
    }

    static async findById(id: string) {
        return db.product.findUnique({
            where: { id },
            include: {
                bookingSlots: {
                    where: {
                        status: 'AVAILABLE',
                    },
                },
                outlet: {
                    select: {
                        business: {
                            select: {
                                defaultTransactionFeeBearer: true,
                            }
                        }
                    }
                }
                // productImages table doesn't exist, image is stored in product.image field
            },
        });
    }

    static async findByOutletId(params: {
        outletId: string;
        productType: ProductType,
        q?: string;
        accessed?: string;
        page: number;
        limit: number;
    }): Promise<{ data: Product[]; total: number }> {
        const { outletId, q, accessed, page, limit, productType } = params;

        const where: Prisma.ProductWhereInput = {
            AND: [
                { outletId },
                ...(q && q !== "" ? [{
                    name: {
                        contains: q,
                        mode: 'insensitive' as Prisma.QueryMode,
                    }
                }] : [{}]),
                ...(accessed && accessed !== "OWNER" ? [
                    { status: "ACTIVE" } as Prisma.ProductWhereInput,
                ] : []),
                ...(productType ? [{ type: productType }] : [])
            ]
        };

        const skip = (page - 1) * limit;

        const [data, total] = await db.$transaction([
            db.product.findMany({
                where,
                skip,
                take: limit,
            }),
            db.product.count({ where }),
        ]);

        return { data, total };
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
                    mode: 'insensitive' as Prisma.QueryMode, // Case-insensitive search
                },
            },
        });
    }
}