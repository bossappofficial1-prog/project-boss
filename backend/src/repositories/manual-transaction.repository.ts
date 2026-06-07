import { db } from "../config/prisma";
import { GuestCustomer, Order, OrderItem, Transaction, Prisma } from "@prisma/client";

export type ProductWithRelations = Awaited<ReturnType<typeof db.product.findFirst>> & {
  goods: { sellingPrice: number; averageHpp: number } | null;
  service: { sellingPrice: number; commissionType: string; commissionValue: number } | null;
  ticket: { sellingPrice: number } | null;
};

export class ManualTransactionRepository {
  static async findOrCreateGuestCustomer(
    phone: string | undefined,
    name: string | undefined
  ): Promise<GuestCustomer> {
    if (!phone) {
      const anonymousPhone = `anonymous-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return db.guestCustomer.create({
        data: {
          name: name || "Customer Manual",
          phone: anonymousPhone,
        },
      });
    }

    const cleanPhone = phone.replace(/[^\d+]/g, "");
    let customer = await db.guestCustomer.findUnique({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      customer = await db.guestCustomer.create({
        data: {
          name: name?.trim() || "Customer Manual",
          phone: cleanPhone,
        },
      });
    } else if (name && name.trim() && name.trim() !== customer.name) {
      customer = await db.guestCustomer.update({
        where: { id: customer.id },
        data: { name: name.trim() },
      });
    }

    return customer;
  }

  static async findProductsByIds(productIds: string[]) {
    return db.product.findMany({
      where: {
        id: { in: productIds },
        status: "ACTIVE",
      },
      include: {
        goods: true,
        service: true,
        ticket: true,
      },
    });
  }

  static async createOrder(data: Prisma.OrderCreateInput): Promise<Order> {
    return db.order.create({ data });
  }

  static async createTransaction(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return db.transaction.create({ data });
  }

  static async deductStockForGoods(orderId: string): Promise<void> {
    const orderItems = await db.orderItem.findMany({
      where: { orderId },
      include: { product: { include: { goods: true } } },
    });

    for (const item of orderItems) {
      if (item.product.type === "GOODS" && item.product.goods) {
        await db.productGoods.update({
          where: { productId: item.product.id },
          data: { currentStock: { decrement: item.quantity } },
        });
      }
    }
  }
}