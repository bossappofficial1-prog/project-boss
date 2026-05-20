import { db } from "../config/prisma";
import { DeleteRequestStatus, StockMovementType, TicketCodeStatus, Prisma } from "@prisma/client";

export class TransactionDeleteRepository {
  static async findTransactionWithDetails(transactionId: string) {
    return db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        order: {
          include: {
            guestCustomer: { select: { name: true, phone: true } },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    goods: { select: { id: true, currentStock: true, averageHpp: true } },
                    ticket: { select: { id: true, soldCount: true } },
                  },
                },
                ticketCodes: true,
                bookingSlot: { select: { id: true, status: true } },
              },
            },
            outlet: { select: { id: true, businessId: true } },
            handledByStaff: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  static async findPendingRequestByTransaction(transactionId: string) {
    return db.transactionDeleteRequest.findFirst({
      where: {
        transactionId,
        status: DeleteRequestStatus.PENDING,
      },
    });
  }

  static async createDeleteRequest(data: {
    transactionId: string;
    orderId: string;
    outletId: string;
    requestedBy: string;
    reason?: string;
    customerName: string;
    customerPhone: string;
    items: Prisma.InputJsonValue;
    totalAmount: number;
  }) {
    return db.transactionDeleteRequest.create({
      data,
      include: {
        requestedStaff: { select: { name: true } },
        outlet: {
          include: {
            business: {
              include: {
                owner: { select: { id: true } },
              },
            },
          },
        },
      },
    });
  }

  static async findRequestById(requestId: string) {
    return db.transactionDeleteRequest.findUnique({
      where: { id: requestId },
      include: {
        transaction: true,
        order: true,
        outlet: {
          include: {
            business: {
              include: {
                owner: { select: { id: true } },
              },
            },
          },
        },
        requestedStaff: { select: { name: true } },
      },
    });
  }

  static async updateRequestStatus(requestId: string, data: {
    status: DeleteRequestStatus;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionNote?: string;
  }) {
    return db.transactionDeleteRequest.update({
      where: { id: requestId },
      data,
    });
  }

  static async restoreGoodsStock(productGoodsId: string, quantity: number, orderId: string, hppPerUnit: number) {
    return db.productGoods.update({
      where: { id: productGoodsId },
      data: {
        currentStock: { increment: quantity },
      },
    });
  }

  static async createStockLog(data: {
    productGoodsId: string;
    type: StockMovementType;
    quantity: number;
    hppPerUnit?: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }) {
    return db.stockLog.create({ data });
  }

  static async restoreTicketQuota(productTicketId: string, quantity: number) {
    return db.productTicket.update({
      where: { id: productTicketId },
      data: {
        soldCount: { decrement: quantity },
      },
    });
  }

  static async cancelTicketCodes(orderItemId: string) {
    return db.ticketCode.updateMany({
      where: { orderItemId },
      data: { status: TicketCodeStatus.CANCELLED },
    });
  }

  static async refundLoyaltyPoints(outletId: string, guestCustomerId: string, orderId: string, points: number) {
    return db.$transaction([
      db.outletMembership.update({
        where: {
          guestCustomerId_outletId: { guestCustomerId, outletId },
        },
        data: { totalPoints: { increment: points } },
      }),
      db.loyaltyPointHistory.create({
        data: {
          outletId,
          guestCustomerId,
          orderId,
          type: "ADJUSTMENT_IN" as any,
          points,
          note: "Refund poin akibat penghapusan transaksi",
        },
      }),
    ]);
  }

  static async deleteTransactionAndOrder(transactionId: string, orderId: string) {
    return db.$transaction(async (tx) => {
      await tx.ticketCode.deleteMany({
        where: { orderItem: { orderId } },
      });

      if (transactionId) {
        await tx.transaction.delete({
          where: { id: transactionId },
        });
      }

      await tx.orderItem.deleteMany({
        where: { orderId },
      });

      await tx.loyaltyPointHistory.deleteMany({
        where: { orderId },
      });

      const deletedOrder = await tx.order.delete({
        where: { id: orderId },
      });

      return deletedOrder;
    });
  }

  static async getRequestsByOutlet(outletId: string, status?: DeleteRequestStatus) {
    const where: any = { outletId };
    if (status) where.status = status;

    return db.transactionDeleteRequest.findMany({
      where,
      include: {
        transaction: true,
        order: true,
        requestedStaff: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getOwnerPendingRequests(businessId: string) {
    return db.transactionDeleteRequest.findMany({
      where: {
        outlet: { businessId },
        status: DeleteRequestStatus.PENDING,
      },
      include: {
        outlet: { select: { id: true, name: true } },
        requestedStaff: { select: { id: true, name: true } },
        transaction: true,
        order: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
