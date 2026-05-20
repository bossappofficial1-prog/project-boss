import { db } from "../config/prisma";

export class CashierShiftRepository {
  static async findActiveShift(outletId: string, staffId: string) {
    return db.cashierShift.findFirst({
      where: {
        outletId,
        staffId,
        status: "OPEN",
        closedAt: null,
      },
      orderBy: { openedAt: "desc" },
      include: { cashMovements: { orderBy: { createdAt: "desc" } } },
    });
  }

  static async findById(id: string) {
    return db.cashierShift.findUnique({
      where: { id },
    });
  }

  static async create(data: {
    outletId: string;
    staffId: string;
    status: "OPEN";
    openedAt: Date;
    openingCash: number;
    notes?: string;
    cashMovements?: any;
  }) {
    return db.cashierShift.create({
      data,
      include: { cashMovements: { orderBy: { createdAt: "desc" } } },
    });
  }

  static async update(
    id: string,
    data: {
      status: "CLOSED";
      closedAt: Date;
      closingCash: number;
      notes?: string;
    }
  ) {
    return db.cashierShift.update({
      where: { id },
      data,
      include: { cashMovements: { orderBy: { createdAt: "desc" } } },
    });
  }

  static async createMovement(data: {
    shiftId: string;
    type: "CASH_DROP" | "PAID_OUT" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
    amount: number;
    note?: string;
  }) {
    return db.cashMovement.create({
      data,
    });
  }

  static async findMany(params: {
    outletId: string;
    from?: Date;
    to?: Date;
  }) {
    const { outletId, from, to } = params;
    return db.cashierShift.findMany({
      where: {
        outletId,
        openedAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { openedAt: "desc" },
      include: {
        staff: { select: { id: true, name: true, username: true } },
        cashMovements: true,
      },
      take: 200,
    });
  }

  static async sumSales(cashierShiftId: string) {
    return db.transaction.aggregate({
      where: {
        cashierShiftId,
        status: "SUCCESS",
      },
      _sum: { amount: true },
      _count: { _all: true } as any,
    });
  }

  static async sumCashSales(cashierShiftId: string) {
    return db.transaction.aggregate({
      where: {
        cashierShiftId,
        status: "SUCCESS",
        paymentMethod: "cash",
      },
      _sum: { amount: true },
    });
  }

  static async sumQrisSales(cashierShiftId: string) {
    return db.transaction.aggregate({
      where: {
        cashierShiftId,
        status: "SUCCESS",
        paymentMethod: "qris",
      },
      _sum: { amount: true },
    });
  }
}
