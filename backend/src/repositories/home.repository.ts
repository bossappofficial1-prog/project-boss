import { db } from "../config/prisma";
import { Prisma } from "@prisma/client";

export class HomeRepository {
    // 1. Optimasi: Gunakan count(1) lebih ringan dari count(*)
    static async countVerifiedUmkm() {
        const result = await db.$queryRaw<{ count: number }[]>`
            SELECT COUNT(1)::int as count
            FROM "User"
            WHERE role = 'OWNER' AND "isVerified" = true;
        `;
        return result[0]?.count || 0;
    }

    static async countSuccessfulTransactions() {
        const result = await db.$queryRaw<{ count: number }[]>`
            SELECT COUNT(1)::int as count
            FROM "Transaction"
            WHERE status = 'SUCCESS';
        `;
        return result[0]?.count || 0;
    }

    static async findTopOutlets(searchQuery?: string) {
        const searchParam = searchQuery ? `%${searchQuery}%` : null;

        // 2. Optimasi: Pindahkan pengecekan jam operasional FULL ke SQL (PostgreSQL Engine)
        // Ini menghindari parsing ratusan string Date di Javascript Node.js
        const rawOutlets = await db.$queryRaw<any[]>`
            SELECT 
                o.*,
                CASE 
                    WHEN o."isOpen" = false THEN false
                    ELSE COALESCE(
                        (
                            SELECT true
                            FROM "OutletOperatingHours" oh
                            WHERE oh."outletId" = o.id
                                AND oh."isOpen" = true
                                AND oh."dayOfWeek" = EXTRACT(DOW FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::int
                                -- PERBAIKAN: Gunakan waktu 'Asia/Jakarta' saat ini untuk dibandingkan dengan jam operasional
                                AND (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time 
                                    BETWEEN (oh."openTime" AT TIME ZONE 'UTC')::time 
                                    AND (oh."closeTime" AT TIME ZONE 'UTC')::time
                            LIMIT 1
                        ), 
                        false
                    )
                END AS "isCurrentlyOpen",
                json_build_object('name', b.name) as business,
                json_build_object('orders', COALESCE(order_counts.successful_orders, 0)) as "_count"
            FROM "Outlet" o
            JOIN "Business" b ON o."businessId" = b.id
            -- Menghitung order 30 hari terakhir
            LEFT JOIN (
                SELECT ord."outletId", COUNT(ord.id)::int as successful_orders
                FROM "Order" ord
                JOIN "Transaction" tr ON tr."orderId" = ord.id
                WHERE tr.status = 'SUCCESS'
                    AND ord."createdAt" >= NOW() - INTERVAL '30 days'
                GROUP BY ord."outletId"
            ) order_counts ON order_counts."outletId" = o.id
            
            ${searchParam ? Prisma.sql`WHERE o.name ILIKE ${searchParam} OR b.name ILIKE ${searchParam}` : Prisma.empty}
            
            ORDER BY COALESCE(order_counts.successful_orders, 0) DESC
            LIMIT 6;
        `;

        // Proses Node.js menjadi sangat tipis dan cepat
        return rawOutlets.map(outlet => {
            const { isCurrentlyOpen, ...rest } = outlet;
            return {
                ...rest,
                isOpen: isCurrentlyOpen,
                status: isCurrentlyOpen,
            };
        });
    }

    static async findPopularItems(limit = 8) {
        // Query ini tetap berat karena aggregasi join 30 hari, 
        // tapi aman karena akan dilindungi oleh Cache di Service layer
        const rawItems = await db.$queryRaw<any[]>`
            SELECT
                p.id,
                p.name,
                p.image,
                p.type,
                out.slug,
                COALESCE(pg."sellingPrice", ps."sellingPrice", pt."sellingPrice", 0) AS price,
                SUM(oi.quantity)::int AS sold_count
            FROM "Product" p
            INNER JOIN "Outlet" out ON out.id = p."outletId"
            LEFT JOIN "ProductGoods" pg ON pg."productId" = p.id
            LEFT JOIN "ProductService" ps ON ps."productId" = p.id
            LEFT JOIN "ProductTicket" pt ON pt."productId" = p.id
            INNER JOIN "OrderItem" oi ON oi."productId" = p.id
            INNER JOIN "Order" o ON o.id = oi."orderId"
            INNER JOIN "Transaction" t ON t."orderId" = o.id
            WHERE t.status = 'SUCCESS'
              AND o."createdAt" >= NOW() - INTERVAL '30 days'
            GROUP BY p.id, p.name, p.image, p.type, out.slug, pg."sellingPrice", ps."sellingPrice", pt."sellingPrice"
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