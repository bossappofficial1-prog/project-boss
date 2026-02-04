import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { db } from "../config/prisma";

export class ReportRepository {
  static async getOutletReport(
    outletId: string,
    date: string,
    startDate: Date,
    endDate: Date,
    type: "daily" | "weekly" | "monthly",
  ) {
    const whereClause: any = {
      date: { gte: startDate, lte: endDate },
    };
    const orderWhere: any = {
      orderStatus: "COMPLETED",
      createdAt: { gte: startDate, lte: endDate },
    };
    const stockWhere: any = {
      type: "IN",
      createdAt: { gte: startDate, lte: endDate },
    };

    if (outletId && outletId !== "all") {
      whereClause.outletId = outletId;
      orderWhere.outletId = outletId;
      stockWhere.productGoods = { product: { outletId } };
    } else {
      // For stock logs, if all outlets, we still need to filter by product->outlet connection roughly?
      // Actually, stockLog -> productGoods -> product -> outletId.
      // If outletId is 'all', we just don't filter by it, effectively getting all.
    }

    const [orders, expenses, stockLogs] = await Promise.all([
      db.order.findMany({
        where: orderWhere,
        include: {
          items: {
            include: {
              product: {
                include: { service: true, goods: true },
              },
            },
          },
        },
      }),
      db.expense.findMany({
        where: whereClause,
      }),
      db.stockLog.findMany({
        where: stockWhere,
        include: {
          productGoods: {
            include: {
              product: true,
            },
          },
        },
      }),
    ]);

    return { orders, expenses, stockLogs };
  }
}
