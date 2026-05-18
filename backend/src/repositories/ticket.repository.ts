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
            product: { 
              include: { 
                ticket: {
                  select: {
                    eventDate: true,
                    eventEndDate: true,
                    venue: true,
                    venueAddress: true,
                    codeFormat: true,
                    designConfig: true,
                  }
                }
              } 
            },
            order: {
              include: {
                guestCustomer: { select: { name: true } },
                outlet: { select: { name: true } }
              }
            }
          },
        },
        redeemedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async findByProductId(productId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [codes, total, totalRedeemed, totalValid] = await Promise.all([
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
      db.ticketCode.count({ where: { orderItem: { productId }, status: "REDEEMED" } }),
      db.ticketCode.count({ where: { orderItem: { productId }, status: "VALID" } }),
    ]);
    return { codes, total, page, limit, totalRedeemed, totalValid };
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
