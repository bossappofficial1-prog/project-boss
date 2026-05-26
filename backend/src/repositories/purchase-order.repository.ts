import { db } from "../config/prisma";
import { Prisma, PurchaseOrderStatus } from "@prisma/client";

const poInclude = {
  supplier: true,
  outlet: true,
  items: {
    include: {
      productGoods: {
        include: {
          product: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      ingredient: true,
    },
  },
} satisfies Prisma.PurchaseOrderInclude;

export class PurchaseOrderRepository {
  static async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.purchaseOrder.findUnique({
      where: { id },
      include: poInclude,
    });
  }

  static async findDraftBySupplierAndOutlet(
    supplierId: string,
    outletId: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db;
    return client.purchaseOrder.findFirst({
      where: {
        supplierId,
        outletId,
        status: "DRAFT",
      },
      include: poInclude,
    });
  }

  static async findAll(query: {
    outletId: string;
    status?: PurchaseOrderStatus;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { outletId, status, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {
      outletId,
      ...(status && { status }),
      ...(search?.trim() && {
        OR: [
          { poNumber: { contains: search, mode: "insensitive" } },
          { supplier: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [data, total] = await db.$transaction([
      db.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: poInclude,
      }),
      db.purchaseOrder.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async create(
    data: {
      poNumber: string;
      supplierId: string;
      outletId: string;
      notes?: string;
      totalEstimate?: number;
    },
    items: Array<{
      productGoodsId?: string;
      ingredientId?: string;
      quantity: number;
      priceAtOrder: number;
    }>,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db;
    const totalEstimate = data.totalEstimate !== undefined
      ? data.totalEstimate
      : items.reduce((sum, item) => sum + (item.quantity * item.priceAtOrder), 0);

    return client.purchaseOrder.create({
      data: {
        poNumber: data.poNumber,
        supplierId: data.supplierId,
        outletId: data.outletId,
        notes: data.notes,
        totalEstimate: totalEstimate,
        items: {
          create: items,
        },
      },
      include: poInclude,
    });
  }

  static async addOrUpdateItem(
    purchaseOrderId: string,
    item: {
      productGoodsId?: string;
      ingredientId?: string;
      quantity: number;
      priceAtOrder: number;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db;
    const existing = await client.purchaseOrderItem.findFirst({
      where: {
        purchaseOrderId,
        productGoodsId: item.productGoodsId || null,
        ingredientId: item.ingredientId || null,
      },
    });

    if (existing) {
      await client.purchaseOrderItem.update({
        where: { id: existing.id },
        data: {
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
        },
      });
    } else {
      await client.purchaseOrderItem.create({
        data: {
          purchaseOrderId,
          productGoodsId: item.productGoodsId,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
        },
      });
    }

    // Update total PO estimate
    const allItems = await client.purchaseOrderItem.findMany({
      where: { purchaseOrderId },
    });
    const totalEstimate = allItems.reduce((sum, it) => sum + (it.quantity * it.priceAtOrder), 0);

    return client.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { totalEstimate },
      include: poInclude,
    });
  }

  static async updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db;
    return client.purchaseOrder.update({
      where: { id },
      data: { status },
      include: poInclude,
    });
  }

  static async updateDraftItems(
    id: string,
    items: Array<{
      productGoodsId?: string;
      ingredientId?: string;
      quantity: number;
      priceAtOrder: number;
    }>,
    notes?: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db;
    
    // Clear old items first, then recreate
    await client.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: id },
    });

    const totalEstimate = items.reduce((sum, item) => sum + (item.quantity * item.priceAtOrder), 0);

    return client.purchaseOrder.update({
      where: { id },
      data: {
        notes,
        totalEstimate,
        items: {
          create: items.map(item => ({
            productGoodsId: item.productGoodsId,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            priceAtOrder: item.priceAtOrder,
          })),
        },
      },
      include: poInclude,
    });
  }
}
