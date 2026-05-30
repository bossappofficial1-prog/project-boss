import { db } from "../config/prisma";
import { Prisma, StockTransferStatus } from "@prisma/client";

export class StockTransferRepository {
  static async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.stockTransfer.findUnique({
      where: { id },
      include: {
        senderOutlet: true,
        receiverOutlet: true,
        items: {
          include: {
            product: {
              include: {
                goods: true,
              },
            },
          },
        },
      },
    });
  }

  static async findAll(query: any, businessId: string) {
    const { page = 1, limit = 10, search, status, senderOutletId, receiverOutletId } = query;
    const skip = (page - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.StockTransferWhereInput = {
      businessId,
    };

    if (status) {
      where.status = status as StockTransferStatus;
    }

    if (senderOutletId) {
      where.senderOutletId = senderOutletId;
    }

    if (receiverOutletId) {
      where.receiverOutletId = receiverOutletId;
    }

    if (search) {
      where.OR = [
        { note: { contains: search, mode: "insensitive" } },
        { senderOutlet: { name: { contains: search, mode: "insensitive" } } },
        { receiverOutlet: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await db.$transaction([
      db.stockTransfer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          senderOutlet: true,
          receiverOutlet: true,
          items: {
            include: {
              product: {
                include: {
                  goods: true,
                },
              },
            },
          },
        },
      }),
      db.stockTransfer.count({ where }),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take),
    };
  }

  static async create(data: {
    businessId: string;
    senderOutletId: string;
    receiverOutletId: string;
    shippingDate: Date;
    note?: string;
    items: { productId: string; quantity: number }[];
  }) {
    return db.stockTransfer.create({
      data: {
        businessId: data.businessId,
        senderOutletId: data.senderOutletId,
        receiverOutletId: data.receiverOutletId,
        shippingDate: data.shippingDate,
        note: data.note,
        status: StockTransferStatus.PENDING,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  static async updateStatus(id: string, status: StockTransferStatus, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.stockTransfer.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              include: {
                goods: true,
              },
            },
          },
        },
      },
    });
  }
}
