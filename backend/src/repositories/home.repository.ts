import { db } from "../config/prisma";

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
        let rawOutlets: any[];

        if (searchQuery) {
            const searchParam = `%${searchQuery}%`;
            rawOutlets = await db.$queryRaw<any[]>`
                SELECT 
                    o.*,
                    -- Logika pengecekan jam buka operasional dinamis
                    CASE 
                        WHEN o."isOpen" = false THEN false
                        ELSE COALESCE(
                            (
                                SELECT true
                                FROM "OutletOperatingHours" oh
                                WHERE oh."outletId" = o.id
                                  AND oh."isOpen" = true
                                  -- DOW mengembalikan 0-6 (Minggu-Sabtu), disesuaikan dengan timezone WIB
                                  AND oh."dayOfWeek" = EXTRACT(DOW FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::int
                                  -- Bandingkan jam sekarang (UTC) dengan jam buka/tutup di database (UTC)
                                  AND (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time 
                                      BETWEEN (oh."openTime" AT TIME ZONE 'Asia/Jakarta')::time 
                                      AND (oh."closeTime" AT TIME ZONE 'Asia/Jakarta')::time
                                LIMIT 1
                            ), 
                            false
                        )
                    END AS "isCurrentlyOpen",
                    json_build_object('name', b.name) as business,
                    COALESCE(
                        (
                            SELECT json_agg(row_to_json(oh.*))
                            FROM "OutletOperatingHours" oh
                            WHERE oh."outletId" = o.id
                        ), 
                        '[]'::json
                    ) as "operatingHours",
                    json_build_object('orders', COALESCE(order_counts.successful_orders, 0)) as "_count"
                FROM "Outlet" o
                JOIN "Business" b ON o."businessId" = b.id
                LEFT JOIN (
                    SELECT ord."outletId", COUNT(ord.id)::int as successful_orders
                    FROM "Order" ord
                    JOIN "Transaction" tr ON tr."orderId" = ord.id
                    WHERE tr.status = 'SUCCESS'
                    GROUP BY ord."outletId"
                ) order_counts ON order_counts."outletId" = o.id
                WHERE o.name ILIKE ${searchParam} 
                   OR b.name ILIKE ${searchParam}
                LIMIT 6;
            `;
        } else {
            rawOutlets = await db.$queryRaw<any[]>`
                SELECT 
                    o.*,
                    -- Logika pengecekan jam buka operasional dinamis
                    CASE 
                        WHEN o."isOpen" = false THEN false
                        ELSE COALESCE(
                            (
                                SELECT true
                                FROM "OutletOperatingHours" oh
                                WHERE oh."outletId" = o.id
                                  AND oh."isOpen" = true
                                  AND oh."dayOfWeek" = EXTRACT(DOW FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::int
                                  AND (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time 
                                      BETWEEN (oh."openTime" AT TIME ZONE 'Asia/Jakarta')::time 
                                      AND (oh."closeTime" AT TIME ZONE 'Asia/Jakarta')::time
                                LIMIT 1
                            ), 
                            false
                        )
                    END AS "isCurrentlyOpen",
                    json_build_object('name', b.name) as business,
                    COALESCE(
                        (
                            SELECT json_agg(row_to_json(oh.*))
                            FROM "OutletOperatingHours" oh
                            WHERE oh."outletId" = o.id
                        ), 
                        '[]'::json
                    ) as "operatingHours",
                    json_build_object('orders', COALESCE(order_counts.successful_orders, 0)) as "_count"
                FROM "Outlet" o
                JOIN "Business" b ON o."businessId" = b.id
                LEFT JOIN (
                    SELECT ord."outletId", COUNT(ord.id)::int as successful_orders
                    FROM "Order" ord
                    JOIN "Transaction" tr ON tr."orderId" = ord.id
                    WHERE tr.status = 'SUCCESS'
                    GROUP BY ord."outletId"
                ) order_counts ON order_counts."outletId" = o.id
                ORDER BY COALESCE(order_counts.successful_orders, 0) DESC
                LIMIT 6;
            `;
        }

        return rawOutlets.map(outlet => {
            // Pisahkan alias "isCurrentlyOpen" yang kita buat di SQL
            const { isCurrentlyOpen, ...rest } = outlet;

            return {
                ...rest,
                // Timpa nilai "isOpen" bawaan Outlet dengan hasil pengecekan jam operasional
                isOpen: isCurrentlyOpen,
                operatingHours: rest.operatingHours.map((oh: any) => ({
                    ...oh,
                    openTime: new Date(oh.openTime),
                    closeTime: new Date(oh.closeTime),
                    createdAt: new Date(oh.createdAt),
                    updatedAt: new Date(oh.updatedAt)
                }))
            };
        });
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
