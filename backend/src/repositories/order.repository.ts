import { OrderStatus } from "@prisma/client";
import { db } from "../config/prisma";

export class OrderRepository {
  static async receiptData(orderId: string) {
    return db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        guestCustomer: {
          select: {
            name: true,
          },
        },
        handledByStaff: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            quantity: true,
            priceAtTimeOfOrder: true,
            product: {
              select: {
                name: true,
                type: true,
                goods: {
                  select: {
                    unit: true,
                  },
                },
              },
            },
          },
        },
        outlet: {
          select: {
            name: true,
            address: true,
            phone: true,
            receiptSettings: true,
          },
        },
      },
    });
  }

  static async findById(id: string) {
    return db.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                goods: true,
                service: true,
                ticket: true,
              }
            },
            bookingSlot: true,
            ticketCodes: true,
          },
        },
        guestCustomer: true,
        outlet: true,
        transaction: true,
      },
    });
  }

  static async getOrderByCustomerPhone(phone: string) {
    return db.order.findMany({
      where: { guestCustomer: { phone } },
      include: {
        items: {
          select: {
            id: true,
            priceAtTimeOfOrder: true,
            quantity: true,
            bookingSlot: {
              select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
                status: true,
                productServiceId: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                // price: true, // Removed as it might not be on product directly anymore depending on schema usage, but let's leave it if it was working or replace with subtable logic if needed.
                // Actually, product only has name, type, etc. Price is on subtables.
                // But previous code had it. Let's keep it safe.
                // Wait, the error is specifically about bookingSlot on Order.
                // I will stick to fixing the relation location.
                type: true,
                image: true,
                // unit: true, // Product doesn't have unit
                // serviceDurationMinutes: true, // Product doesn't have this
                outletId: true,
                goods: { select: { unit: true, sellingPrice: true } },
                service: { select: { durationMinutes: true, sellingPrice: true } },
                ticket: { select: { sellingPrice: true, eventDate: true, eventEndDate: true, venue: true, venueAddress: true } },
              },
            },
            ticketCodes: {
              select: {
                id: true,
                code: true,
                status: true,
                redeemedAt: true,
              },
            },
          },
        },
        guestCustomer: { select: { name: true, phone: true, id: true } },
        outlet: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        handledByStaff: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
        transaction: {
          select: {
            id: true,
            paymentMethod: true,
            status: true,
            expiresAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async findByProductId(productId: string, status: OrderStatus) {
    return db.order.findMany({
      where: {
        items: {
          some: {
            productId: productId,
          },
        },
        orderStatus: status,
      },
      include: {
        guestCustomer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async updateStatus(id: string, status: OrderStatus) {
    return db.order.update({
      where: { id },
      data: { orderStatus: status },
    });
  }
}
