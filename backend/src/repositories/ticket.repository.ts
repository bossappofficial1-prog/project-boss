import { Prisma, TicketCodeStatus } from "@prisma/client";
import { db } from "../config/prisma";

export class TicketRepository {
  static async createMany(
    data: Prisma.TicketCodeCreateManyInput[],
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? db;
    return client.ticketCode.createMany({ data });
  }

  static async findByCode(code: string) {
    return db.ticketCode.findUnique({
      where: { code },
      include: {
        orderItem: {
          include: {
            order: {
              include: {
                guestCustomer: true,
                outlet: true,
              },
            },
            product: {
              include: { ticket: true },
            },
          },
        },
        redeemedBy: { select: { id: true, name: true } },
      },
    });
  }

  static async findByOrderItemId(orderItemId: string) {
    return db.ticketCode.findMany({
      where: { orderItemId },
      orderBy: { createdAt: "asc" },
    });
  }

  static async findByOrderId(orderId: string) {
    return db.ticketCode.findMany({
      where: { orderItem: { orderId } },
      include: {
        orderItem: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
        redeemedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async findByProductId(productId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [codes, total] = await Promise.all([
      db.ticketCode.findMany({
        where: { orderItem: { productId } },
        include: {
          orderItem: {
            select: {
              order: {
                select: {
                  id: true,
                  orderStatus: true,
                  guestCustomer: { select: { name: true, phone: true } },
                },
              },
            },
          },
          redeemedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.ticketCode.count({ where: { orderItem: { productId } } }),
    ]);
    return { codes, total, page, limit };
  }

  static async redeem(code: string, staffId?: string) {
    return db.ticketCode.update({
      where: { code },
      data: {
        status: TicketCodeStatus.REDEEMED,
        redeemedAt: new Date(),
        ...(staffId ? { redeemedById: staffId } : {}),
      },
    });
  }

  static async updateStatus(code: string, status: TicketCodeStatus) {
    return db.ticketCode.update({
      where: { code },
      data: { status },
    });
  }

  static async cancelByOrderItemId(
    orderItemId: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? db;
    return client.ticketCode.updateMany({
      where: {
        orderItemId,
        status: TicketCodeStatus.VALID,
      },
      data: { status: TicketCodeStatus.CANCELLED },
    });
  }
}
