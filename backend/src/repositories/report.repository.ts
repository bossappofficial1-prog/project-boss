import { Prisma } from "@prisma/client";
import { db } from "../config/prisma";

export class ReportRepository {
  /**
   * 1. Agregasi Pendapatan
   * RAW QUERY: Lebih cepat karena SUM dan COUNT dihitung langsung oleh Database C-Engine.
   */
  static async getRevenueAggregate(outletId: string, start: Date, end: Date) {
    const result = await db.$queryRaw<any[]>`
      SELECT 
        SUM("totalAmount") as "totalAmount", 
        COUNT(id) as "count"
      FROM "Order"
      WHERE "outletId" = ${outletId}
        AND "orderStatus" = 'COMPLETED'::"OrderStatus"
        AND "createdAt" >= ${start}
        AND "createdAt" <= ${end}
    `;

    return {
      _sum: { totalAmount: result[0]?.totalAmount ? Number(result[0].totalAmount) : 0 },
      _count: { id: result[0]?.count ? Number(result[0].count) : 0 },
    };
  }

  /**
   * 2. Agregasi Pengeluaran
   * RAW QUERY
   * Menyesuaikan dengan schema @@map("expenses")
   */
  static async getExpenseAggregate(outletId: string, start: Date, end: Date) {
    const result = await db.$queryRaw<any[]>`
      SELECT 
        SUM("amount") as "totalAmount", 
        COUNT(id) as "count"
      FROM "expenses"
      WHERE "outletId" = ${outletId}
        AND "date" >= ${start}
        AND "date" <= ${end}
    `;

    return {
      _sum: { amount: result[0]?.totalAmount ? Number(result[0].totalAmount) : 0 },
      _count: { id: result[0]?.count ? Number(result[0].count) : 0 },
    };
  }

  /**
   * 3. Penarikan Data Laporan Outlet
   * RAW QUERY: Menggunakan JSON Aggregation bawaan PostgreSQL (json_agg)
   */
  static async getOutletReport(
    outletIds: string[],
    date: string,
    startDate: Date,
    endDate: Date,
    type: "daily" | "weekly" | "monthly"
  ) {
    if (!outletIds || outletIds.length === 0) {
      return { orders: [], expenses: [], stockLogs: [] };
    }

    const joinedOutletIds = Prisma.join(outletIds);

    // a. Tarik Orders + relasi Items
    const orders = await db.$queryRaw<any[]>`
      SELECT 
        o.id, 
        o."createdAt", 
        o."totalAmount", 
        o."taxAmount", 
        o."midtransFee", 
        o."appFee",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'quantity', oi.quantity,
                'hppAtTimeOfOrder', oi."hppAtTimeOfOrder",
                'commissionAtTimeOfOrder', oi."commissionAtTimeOfOrder"
              )
            )
            FROM "OrderItem" oi
            WHERE oi."orderId" = o.id
          ), '[]'::json
        ) as items
      FROM "Order" o
      WHERE o."outletId" IN (${joinedOutletIds})
        AND o."orderStatus" = 'COMPLETED'::"OrderStatus"
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
    `;

    // b. Tarik Expenses (Dari tabel mapped "expenses")
    const expenses = await db.$queryRaw<any[]>`
      SELECT id, amount, date, "outletId"
      FROM "expenses"
      WHERE "outletId" IN (${joinedOutletIds})
        AND "date" >= ${startDate}
        AND "date" <= ${endDate}
    `;

    // c. Tarik Stock Logs (HPP Masuk)
    const stockLogs = await db.$queryRaw<any[]>`
      SELECT 
        sl.id, 
        sl."createdAt", 
        sl.quantity, 
        sl."hppPerUnit"
      FROM "StockLog" sl
      JOIN "ProductGoods" pg ON sl."productGoodsId" = pg.id
      JOIN "Product" p ON pg."productId" = p.id
      WHERE p."outletId" IN (${joinedOutletIds})
        AND sl."type" = 'IN'::"StockMovementType"
        AND sl."createdAt" >= ${startDate}
        AND sl."createdAt" <= ${endDate}
    `;

    return { orders, expenses, stockLogs };
  }

  /**
   * 4. List Order dengan Produk (Untuk Sales Summary)
   * PRISMA QUERY: Tetap pakai Prisma
   */
  static async getCompletedOrdersWithProducts(outletId: string, start: Date, end: Date) {
    return await db.order.findMany({
      where: {
        outletId: outletId,
        orderStatus: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      select: {
        items: {
          select: {
            productId: true,
            quantity: true,
            priceAtTimeOfOrder: true,
            product: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  /**
   * 5. List Order untuk Staff / Kasir Laporan
   * PRISMA QUERY: Tetap pakai Prisma karena relasinya sangat dalam
   */
  static async getOrdersForStaffReport(outletIds: string[], start: Date, end: Date) {
    return await db.order.findMany({
      where: {
        outletId: { in: outletIds },
        orderStatus: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      select: {
        totalAmount: true,
        handledByStaff: {
          select: { id: true, name: true },
        },
        items: {
          select: {
            quantity: true,
            priceAtTimeOfOrder: true,
            product: {
              select: {
                service: {
                  select: {
                    providerName: true,
                    commissionType: true,
                    commissionValue: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}