import { db } from "../config/prisma";
import { MediaType, MediaSource, ProductMedia } from "@prisma/client";

export interface CreateMediaInput {
    url: string;
    type: MediaType;
    source: MediaSource;
    alt?: string;
    order: number;
    thumbnailUrl?: string;
}

export class ProductMediaRepository {
    static async findByProductId(productId: string): Promise<ProductMedia[]> {
        return db.productMedia.findMany({
            where: { productId },
            orderBy: { order: "asc" },
        });
    }

    static async createMany(productId: string, items: CreateMediaInput[]): Promise<number> {
        const result = await db.productMedia.createMany({
            data: items.map((item) => ({
                productId,
                url: item.url,
                type: item.type,
                source: item.source,
                alt: item.alt,
                order: item.order,
                thumbnailUrl: item.thumbnailUrl,
            })),
        });
        return result.count;
    }

    static async deleteByProductId(productId: string): Promise<number> {
        const result = await db.productMedia.deleteMany({
            where: { productId },
        });
        return result.count;
    }

    static async deleteById(id: string): Promise<ProductMedia> {
        return db.productMedia.delete({
            where: { id },
        });
    }

    static async deleteByIds(ids: string[]): Promise<number> {
        const result = await db.productMedia.deleteMany({
            where: { id: { in: ids } },
        });
        return result.count;
    }

    static async updateOrder(productId: string, orderedIds: string[]): Promise<void> {
        await db.$transaction(
            orderedIds.map((id, index) =>
                db.productMedia.update({
                    where: { id },
                    data: { order: index },
                })
            )
        );
    }
}
