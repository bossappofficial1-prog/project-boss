import { BillStatus, OrderStatus } from "@prisma/client";
import { db } from "../config/prisma";

export class BillRepository {
  static async findById(id: string) {
    return db.bill.findUnique({
      where: { id },
      include: {
        table: {
          include: {
            outlet: true,
          },
        },
        orders: {
          where: {
            orderStatus: {
              notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
            },
          },
          include: {
            guestCustomer: true,
            transaction: true,
            handledByStaff: true,
            items: {
              include: {
                product: {
                  include: {
                    goods: true,
                    service: true,
                    ticket: true,
                  },
                },
                bookingSlot: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  static async findActiveByTable(tableId: string) {
    return db.bill.findFirst({
      where: {
        tableId,
        status: {
          in: [BillStatus.OPEN, BillStatus.BILLED],
        },
      },
      include: {
        table: {
          include: {
            outlet: true,
          },
        },
        orders: {
          where: {
            orderStatus: {
              notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
            },
          },
          include: {
            guestCustomer: true,
            transaction: true,
            items: {
              include: {
                product: {
                  include: {
                    goods: true,
                    service: true,
                    ticket: true,
                  },
                },
                bookingSlot: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  static async findMany(params: { outletId: string; status?: BillStatus }) {
    const { outletId, status } = params;

    return db.bill.findMany({
      where: {
        outletId,
        ...(status ? { status } : {}),
      },
      include: {
        table: true,
        orders: {
          select: {
            id: true,
            totalAmount: true,
            orderStatus: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async createWithOrders(params: {
    outletId: string;
    tableId: string;
    total: number;
    orderIds: string[];
  }) {
    const { outletId, tableId, total, orderIds } = params;

    return db.$transaction(async (tx) => {
      const bill = await tx.bill.create({
        data: {
          outletId,
          tableId,
          total,
          status: BillStatus.OPEN,
        },
      });

      await tx.order.updateMany({
        where: {
          id: { in: orderIds },
          tableId,
        },
        data: {
          billId: bill.id,
        },
      });

      await tx.outletTable.update({
        where: { id: tableId },
        data: { status: "BILLED" },
      });

      return bill;
    });
  }

  static async markPaid(id: string) {
    return db.bill.update({
      where: { id },
      data: {
        status: BillStatus.PAID,
        closedAt: new Date(),
      },
    });
  }
}