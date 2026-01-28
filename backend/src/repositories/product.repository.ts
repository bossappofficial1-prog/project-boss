import { Product, Prisma, ProductType } from "@prisma/client";
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
        return db.$transaction(async (trx) => {
            const product = await trx.product.create({
                data: {
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    outletId: data.outletId,
                    image: data.image,
                    status: data.status
                }
            })

            if (data.type === `GOODS`) {
                await trx.productGoods.create({
                    data: {
                        sellingPrice: data.goods.sellingPrice,
                        averageHpp: data.goods.averageHpp,
                        unit: data.goods.unit,
                        currentStock: data.goods.currentStock,
                        minStock: data.goods.minStock,
                        productId: product.id
                    }
                })
            } else {
                await trx.productService.create({
                    data: {
                        durationMinutes: data.service.durationMinutes,
                        providerName: data.service.providerName,
                        providerEmail: data.service.providerEmail,
                        providerPhone: data.service.providerPhone,
                        sellingPrice: data.service.sellingPrice,
                        commissionType: data.service.commissionType,
                        commissionValue: data.service.commissionValue,
                        productId: product.id
                    }
                })
            }

            return product
        })

    }

    static async findById(id: string) {
        return db.product.findUnique({
            where: { id },
            include: {
                // bookingSlots: {
                //     where: {
                //         status: 'AVAILABLE',
                //     },
                // },
                outlet: {
                    select: {
                        business: true
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
    }) {
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
                select: {
                    id: true,
                    name: true,
                    status: true,
                    description: true,
                    image: true,
                    type: true,
                    createdAt: true,
                    updatedAt: true,

                    goods: true,
                    service: true,
                },
            }),
            db.product.count({ where }),
        ]);

        return { data, total };
    }

    static async update(id: string, data: UpdateProductInput) {
        const { goods, service, ...productData } = data
        return db.$transaction(async (trx) => {
            const product = await trx.product.update({
                where: { id },
                data: productData
            })

            if (goods && data.type === `GOODS`) {
                await trx.productGoods.update({
                    where: { productId: product.id },
                    data: { ...goods }
                })
            }
            if (service && data.type === 'SERVICE') {
                await trx.productService.update({
                    where: { productId: product.id },
                    data: { ...service }
                })
            }

            return product
        })
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