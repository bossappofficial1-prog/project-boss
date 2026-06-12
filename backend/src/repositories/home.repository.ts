import { db } from "../config/prisma";
import { Prisma } from "@prisma/client";
import { getIsOutletOpen, getIsOutletOnBreak } from "../utils/outlet.utils";

export class HomeRepository {
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

    const rawOutlets = await db.$queryRaw<any[]>`
            SELECT 
                o.*,
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

    return rawOutlets.map((outlet) => {
      const mappedOperatingHours = outlet.operatingHours.map((oh: any) => ({
        ...oh,
        openTime: new Date(
          typeof oh.openTime === "string" && !oh.openTime.endsWith("Z")
            ? oh.openTime + "Z"
            : oh.openTime,
        ),
        closeTime: new Date(
          typeof oh.closeTime === "string" && !oh.closeTime.endsWith("Z")
            ? oh.closeTime + "Z"
            : oh.closeTime,
        ),
        breakStart: oh.breakStart
          ? new Date(
              typeof oh.breakStart === "string" && !oh.breakStart.endsWith("Z")
                ? oh.breakStart + "Z"
                : oh.breakStart,
            )
          : null,
        breakEnd: oh.breakEnd
          ? new Date(
              typeof oh.breakEnd === "string" && !oh.breakEnd.endsWith("Z")
                ? oh.breakEnd + "Z"
                : oh.breakEnd,
            )
          : null,
        createdAt: new Date(
          typeof oh.createdAt === "string" && !oh.createdAt.endsWith("Z")
            ? oh.createdAt + "Z"
            : oh.createdAt,
        ),
        updatedAt: new Date(
          typeof oh.updatedAt === "string" && !oh.updatedAt.endsWith("Z")
            ? oh.updatedAt + "Z"
            : oh.updatedAt,
        ),
      }));

      const hasHours = mappedOperatingHours.length > 0;
      const isOpenOutlet =
        outlet.isOpen &&
        (hasHours ? getIsOutletOpen(mappedOperatingHours, new Date()) : false);
      const isBreakOutlet =
        outlet.isOpen &&
        (hasHours
          ? getIsOutletOnBreak(mappedOperatingHours, new Date())
          : false);

      return {
        ...outlet,
        isOpen: isOpenOutlet,
        isBreak: isBreakOutlet,
        status: isOpenOutlet,
        operatingHours: mappedOperatingHours,
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
            AND o."orderStatus" = 'COMPLETED' -- <=== TAMBAHAN KONDISI INI
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
