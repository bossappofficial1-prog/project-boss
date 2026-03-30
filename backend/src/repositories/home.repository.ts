import { Prisma } from "@prisma/client";
import { db } from "../config/prisma";

type HomeOutletRow = {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    image: string | null;
    latitude: number | null;
    longitude: number | null;
    slug: string;
    isOpen: boolean;
    business_name: string | null;
    orders: number;
};

export class HomeRepository {
    static async countVerifiedUmkm() {
        const result = await db.$queryRaw<{ count: number }[]>`
            SELECT CAST(COUNT(*) AS INTEGER) as count
            FROM "User"
            WHERE role = 'OWNER' AND "isVerified" = true;
        `;
        return result[0]?.count || 0;
    }

    static async countSuccessfulTransactions() {
        const result = await db.$queryRaw<{ count: number }[]>`
            SELECT CAST(COUNT(*) AS INTEGER) as count
            FROM "Transaction"
            WHERE status = 'SUCCESS';
        `;
        return result[0]?.count || 0;
    }

    static async findTopOutlets(searchQuery?: string) {
        const currentWibDay = Prisma.sql`CAST(EXTRACT(DOW FROM NOW() AT TIME ZONE 'Asia/Jakarta') AS INTEGER)`;
        const currentWibTime = Prisma.sql`CAST(NOW() AT TIME ZONE 'Asia/Jakarta' AS TIME)`;

        const selectClause = Prisma.sql`
            SELECT 
                o.id,
                o.name,
                o.description,
                o.address,
                o.phone,
                o.image,
                o.latitude,
                o.longitude,
                o.slug,
                b.name AS business_name,
                COALESCE(order_counts.successful_orders, 0) AS orders,
                (
                    o."isOpen" = true
                    AND EXISTS (
                        SELECT 1
                        FROM "OutletOperatingHours" oh
                        WHERE oh."outletId" = o.id
                          AND oh."isOpen" = true
                          AND (
                            (
                                CAST(oh."openTime" AT TIME ZONE 'Asia/Jakarta' AS TIME) = CAST(oh."closeTime" AT TIME ZONE 'Asia/Jakarta' AS TIME)
                                AND oh."dayOfWeek" = ${currentWibDay}
                            )
                            OR (
                                CAST(oh."closeTime" AT TIME ZONE 'Asia/Jakarta' AS TIME) > CAST(oh."openTime" AT TIME ZONE 'Asia/Jakarta' AS TIME)
                                AND oh."dayOfWeek" = ${currentWibDay}
                                AND ${currentWibTime} >= CAST(oh."openTime" AT TIME ZONE 'Asia/Jakarta' AS TIME)
                                AND ${currentWibTime} < CAST(oh."closeTime" AT TIME ZONE 'Asia/Jakarta' AS TIME)
                            )
                            OR (
                                CAST(oh."closeTime" AT TIME ZONE 'Asia/Jakarta' AS TIME) < CAST(oh."openTime" AT TIME ZONE 'Asia/Jakarta' AS TIME)
                                AND (
                                    (
                                        oh."dayOfWeek" = ${currentWibDay}
                                        AND ${currentWibTime} >= CAST(oh."openTime" AT TIME ZONE 'Asia/Jakarta' AS TIME)
                                    )
                                    OR (
                                        oh."dayOfWeek" = MOD(${currentWibDay} + 6, 7)
                                        AND ${currentWibTime} < CAST(oh."closeTime" AT TIME ZONE 'Asia/Jakarta' AS TIME)
                                    )
                                )
                            )
                          )
                    )
                ) AS "isOpen"
            FROM "Outlet" o
            JOIN "Business" b ON o."businessId" = b.id
            LEFT JOIN (
                SELECT ord."outletId", COUNT(ord.id)::int as successful_orders
                FROM "Order" ord
                JOIN "Transaction" tr ON tr."orderId" = ord.id
                WHERE tr.status = 'SUCCESS'
                GROUP BY ord."outletId"
            ) order_counts ON order_counts."outletId" = o.id
        `;

        let rawOutlets: HomeOutletRow[];

        if (searchQuery) {
            const searchParam = `%${searchQuery}%`;
            rawOutlets = await db.$queryRaw<HomeOutletRow[]>`
                ${selectClause}
                WHERE o.name ILIKE ${searchParam} 
                   OR b.name ILIKE ${searchParam}
                ORDER BY COALESCE(order_counts.successful_orders, 0) DESC
                LIMIT 6;
            `;
        } else {
            rawOutlets = await db.$queryRaw<HomeOutletRow[]>`
                ${selectClause}
                ORDER BY COALESCE(order_counts.successful_orders, 0) DESC
                LIMIT 6;
            `;
        }

        return rawOutlets.map(outlet => ({
            id: outlet.id,
            name: outlet.name,
            description: outlet.description,
            address: outlet.address,
            phone: outlet.phone,
            image: outlet.image,
            latitude: outlet.latitude,
            longitude: outlet.longitude,
            slug: outlet.slug,
            isOpen: outlet.isOpen,
            business: { name: outlet.business_name },
            _count: { orders: Number(outlet.orders ?? 0) }
        }));
    }

    static async findPopularItems(limit = 8) {
        const rawItems = await db.$queryRaw<any[]>`
        SELECT
            p.id,
            p.name,
            p.image,
            p.type,
            out.slug,
            COALESCE(pg."sellingPrice", ps."sellingPrice", pt."sellingPrice", 0) AS price,
            CAST(SUM(oi.quantity) AS INTEGER) AS sold_count
            FROM "Product" p
            -- Join ke tabel Outlet untuk mengambil slug
            INNER JOIN "Outlet" out ON out.id = p."outletId"
            -- Join ke sub-tabel untuk mengambil harga
            LEFT JOIN "ProductGoods" pg ON pg."productId" = p.id
            LEFT JOIN "ProductService" ps ON ps."productId" = p.id
            LEFT JOIN "ProductTicket" pt ON pt."productId" = p.id
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
                out.slug,
                pg."sellingPrice", 
                ps."sellingPrice",
                pt."sellingPrice"
            ORDER BY sold_count DESC
            LIMIT ${limit}
        `;

        return rawItems.map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            slug: item.slug,
            price: Number(item.price ?? 0),
            image: item.image,
            soldCount: Number(item.sold_count ?? 0),
        }));
    }
}
