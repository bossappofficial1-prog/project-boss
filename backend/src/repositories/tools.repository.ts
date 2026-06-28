import { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "..//config/prisma";

export interface RawOrderTimestamp {
  createdAt: Date;
  totalAmount: number;
}

export interface RawPLOrderItem {
  priceAtTimeOfOrder: number;
  hppAtTimeOfOrder: number;
  quantity: number;
  createdAt: Date;
}

export interface RawPLExpense {
  description: string;
  amount: number;
  date: Date;
}

const COMPLETED_FILTER = {
  orderStatus: OrderStatus.COMPLETED,
  paymentStatus: PaymentStatus.SUCCESS,
};

export class ToolsRepository {
  static async getPeakHours(outletId: string, startDate: Date, endDate: Date) {
    return db.order.findMany({
      where: {
        outletId,
        ...COMPLETED_FILTER,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async getOrderItems(
    outletId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RawPLOrderItem[]> {
    const items = await db.orderItem.findMany({
      where: {
        order: {
          outletId,
          ...COMPLETED_FILTER,
        date: { gte: startDate, lte: endDate },
        },
      },
      select: {
        priceAtTimeOfOrder: true,
        hppAtTimeOfOrder: true,
        quantity: true,
        order: { select: { createdAt: true } },
      },
    });

    return items.map((i) => ({
      priceAtTimeOfOrder: i.priceAtTimeOfOrder,
      hppAtTimeOfOrder: i.hppAtTimeOfOrder,
      quantity: i.quantity,
      createdAt: i.order.createdAt,
    }));
  }

  static async getTotalOrders(
    outletId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const count = await db.order.count({
      where: {
        outletId,
        ...COMPLETED_FILTER,
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    return count;
  }

  static async getExpenses(
    outletId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RawPLExpense[]> {
    return db.expense.findMany({
      where: {
        outletId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        description: true,
        date: true,
      },
      orderBy: { amount: "desc" },
    });
  }
}
