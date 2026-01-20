import { Prisma, UserRole } from "@prisma/client";
import { db } from "../config/prisma";

interface PopularItemRow {
    id: string;
    name: string;
    price: Prisma.Decimal | number | null;
    image: string | null;
    sold_count: bigint | number | null;
}

export class HomeRepository {
    private static readonly successfulOrderFilter: Prisma.OrderWhereInput = {
        transaction: {
            status: "SUCCESS",
        },
    };

    static countVerifiedUmkm() {
        return db.user.count({
            where: {
                role: UserRole.OWNER,
                isVerified: true,
            },
        });
    }

    static countSuccessfulTransactions() {
        return db.transaction.count({
            where: {
                status: "SUCCESS",
            },
        });
    }

    static findTopOutlets(searchQuery?: string) {
        if (searchQuery) {
            return db.outlet.findMany({
                where: {
                    OR: [
                        { name: { contains: searchQuery, mode: "insensitive" } },
                        { business: { name: { contains: searchQuery, mode: "insensitive" } } },
                    ],
                },
                take: 6,
                include: {
                    business: {
                        select: { name: true },
                    },
                    _count: {
                        select: {
                            orders: {
                                where: HomeRepository.successfulOrderFilter,
                            },
                        },
                    },
                },
            });
        }

        return db.outlet.findMany({
            take: 6,
            include: {
                business: {
                    select: { name: true },
                },
                _count: {
                    select: {
                        orders: {
                            where: HomeRepository.successfulOrderFilter,
                        },
                    },
                },
            },
            orderBy: {
                orders: {
                    _count: "desc",
                },
            },
        });
    }

    static async findPopularItems(limit = 8) {
        const rawItems = await db.$queryRaw<PopularItemRow[]>`
            SELECT
                p.id,
                p.name,
                p.price,
                p.image,
                COALESCE(SUM(oi.quantity), 0) AS sold_count
            FROM "Product" p
            LEFT JOIN "OrderItem" oi ON oi."productId" = p.id
            LEFT JOIN "Order" o ON o.id = oi."orderId"
            LEFT JOIN "Transaction" t ON t."orderId" = o.id AND t.status = 'SUCCESS'
            WHERE t.status = 'SUCCESS'
            GROUP BY p.id, p.name, p.price, p.image
            ORDER BY sold_count DESC
            LIMIT ${limit}
        `;

        return rawItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price ?? 0),
            image: item.image,
            soldCount: Number(item.sold_count ?? 0),
        }));
    }

    static async findActivePromos(limit = 6) {
        const promos = await db.promo.findMany({
            where: {
                status: "ACTIVE",
                validUntil: { gte: new Date() },
            },
            orderBy: { validUntil: "asc" },
            take: limit,
        });

        return promos.map((promo) => ({
            id: promo.id,
            code: promo.code,
            description: promo.description,
            type: promo.type,
            value: Number(promo.value),
            status: promo.status,
            minPurchaseAmount: promo.minPurchaseAmount ? Number(promo.minPurchaseAmount) : null,
            validUntil: promo.validUntil,
            validFrom: promo.validFrom,
        }));
    }
}
