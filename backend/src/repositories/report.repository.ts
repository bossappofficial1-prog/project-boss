import { Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository";

export class ReportRepository extends BaseRepository {
  async getRevenueAggregate(outletId: string, start: Date, end: Date) {
    const result = await this.db.$queryRaw<any[]>`
      SELECT 
        SUM("totalAmount") as "totalAmount", 
        COUNT(id) as "count"
      FROM "Order"
      WHERE "outletId" = ${outletId}
        AND "orderStatus" = 'COMPLETED'::"OrderStatus"
        AND "paymentStatus" = 'SUCCESS'::"PaymentStatus"
        AND "createdAt" >= ${start}
        AND "createdAt" <= ${end}
    `;

    return {
      _sum: { totalAmount: result[0]?.totalAmount ? Number(result[0].totalAmount) : 0 },
      _count: { id: result[0]?.count ? Number(result[0].count) : 0 },
    };
  }

  async getExpenseAggregate(outletId: string, start: Date, end: Date) {
    const result = await this.db.$queryRaw<any[]>`
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

  async getOutletReport(
    outletIds: string[],
    date: string,
    startDate: Date,
    endDate: Date,
    type: "daily" | "weekly" | "monthly" | "yearly"
  ) {
    if (!outletIds || outletIds.length === 0) {
      return { orders: [], expenses: [], stockLogs: [] };
    }

    const joinedOutletIds = Prisma.join(outletIds);

    const orders = await this.db.$queryRaw<any[]>`
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
        AND o."paymentStatus" = 'SUCCESS'::"PaymentStatus"
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
    `;

    const expenses = await this.db.$queryRaw<any[]>`
      SELECT id, amount, date, "outletId"
      FROM "expenses"
      WHERE "outletId" IN (${joinedOutletIds})
        AND "date" >= ${startDate}
        AND "date" <= ${endDate}
    `;

    const stockLogs = await this.db.$queryRaw<any[]>`
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

  async getCompletedOrdersWithProducts(outletId: string, start: Date, end: Date) {
    return this.db.order.findMany({
      where: {
        outletId,
        orderStatus: "COMPLETED",
        paymentStatus: "SUCCESS",
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

  async getOrdersForStaffReport(outletIds: string[], start: Date, end: Date) {
    return this.db.order.findMany({
      where: {
        outletId: { in: outletIds },
        orderStatus: "COMPLETED",
        paymentStatus: "SUCCESS",
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

  async getOutletsByBusinessId(businessId: string) {
    return this.db.outlet.findMany({
      where: { businessId },
      select: { id: true, name: true },
    });
  }
}
