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
                    operatingHours: true,
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
                operatingHours: true,
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
        const rawItems = await db.$queryRaw<any[]>`
        SELECT
            p.id,
            p.name,
            p.image,
            p.type,
            p."outletId",
            COALESCE(pg."sellingPrice", ps."sellingPrice", 0) AS price,
            CAST(SUM(oi.quantity) AS INTEGER) AS sold_count
            FROM "Product" p
            -- Join ke sub-tabel untuk mengambil harga
            LEFT JOIN "ProductGoods" pg ON pg."productId" = p.id
            LEFT JOIN "ProductService" ps ON ps."productId" = p.id
            -- Join ke transaksi yang sukses
            INNER JOIN "OrderItem" oi ON oi."productId" = p.id
            INNER JOIN "Order" o ON o.id = oi."orderId"
            INNER JOIN "Transaction" t ON t."orderId" = o.id
            WHERE t.status = 'SUCCESS'
            GROUP BY 
                p.id, 
                p.name, 
                p.image, 
                p.type, 
                pg."sellingPrice", 
                ps."sellingPrice"
            ORDER BY sold_count DESC
            LIMIT ${limit}
    `;

        return rawItems.map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            outletId: item.outletId,
            price: Number(item.price ?? 0),
            image: item.image,
            soldCount: Number(item.sold_count ?? 0),
        }));
    }
}
