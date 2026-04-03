import { Outlet, PaymentStatus, StaffStatus, Prisma } from "@prisma/client";
import { db } from "../config/prisma";
import { CreatePaymentInput } from "../schemas/payment.schema";
import { AppError } from "../errors/app-error";
import { Messages } from "../constants/message";
import { HttpStatus } from "../constants/http-status";
import { getStaffAvailabilityForWindow } from "../service/staff.service";

type ProductWithDetails = Prisma.ProductGetPayload<{ include: { goods: true; service: true; ticket: true } }>;

export class PaymentRepository {
  static async getProductsByIds(productIds: string[]): Promise<ProductWithDetails[]> {
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

  static async getOutletById(outletId: string): Promise<Outlet | null> {
    return db.outlet.findUnique({ where: { id: outletId } });
  }

  static async validateProductAvailability(
    productId: string,
    quantity: number,
  ): Promise<{ available: boolean; product: ProductWithDetails | null; message: string }> {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { goods: true, service: true, ticket: true },
    });

    if (!product) {
      return { available: false, product: null, message: "Produk tidak ditemukan" };
    }

    if (product.status !== "ACTIVE") {
      return { available: false, product, message: "Produk tidak aktif" };
    }

    if (product.type === "GOODS") {
      const stock = product.goods?.currentStock ?? 0;
      if (stock < quantity) {
        return {
          available: false,
          product,
          message: `Stok tidak mencukupi. Stok tersedia: ${stock}`,
        };
      }
    }

    return { available: true, product, message: "Produk tersedia" };
  }

  static calculateTotalAmount(
    products: ProductWithDetails[],
    items: CreatePaymentInput["item_details"],
  ): number {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return total;
      }

      return total + PaymentRepository.resolveProductPrice(product) * item.quantity;
    }, 0);
  }

  static async createOrFindGuestCustomer(name: string, phone: string) {
    let customer = await db.guestCustomer.findFirst({ where: { phone } });

    if (!customer) {
      customer = await db.guestCustomer.create({
        data: { name, phone },
      });
    }

    return customer;
  }

  static async updatePaymentStatusByOrder(orderId: string, status: PaymentStatus) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { include: { goods: true, ticket: true } },
            bookingSlot: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError("Order tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    for (const item of order.items) {
      if (item.product.type === "GOODS" && item.product.goods) {
        await db.productGoods.update({
          where: { productId: item.productId },
          data: {
            currentStock: { increment: item.quantity },
          },
        });
      }

      if (item.product.type === "TICKET" && item.product.ticket) {
        await db.productTicket.update({
          where: { id: item.product.ticket.id },
          data: { soldCount: { decrement: item.quantity } },
        });
      }

      if (item.bookingSlot?.id) {
        await db.bookingSlot.update({
          where: { id: item.bookingSlot.id },
          data: {
            status: "AVAILABLE",
            orderItemId: null,
          },
        });
      }
    }

    await db.transaction.updateMany({ where: { orderId }, data: { status } });

    await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: status,
        cancellationReason: `Cancel by system (payment expired)`,
        orderStatus: "CANCELLED",
      },
    });

    return true;
  }

  static async getByOrderId(orderId: string) {
    return db.transaction.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            guestCustomer: true,
            items: {
              include: {
                product: {
                  include: { goods: true, service: true, ticket: true },
                },
              },
            },
            outlet: {
              include: {
                business: true,
              },
            },
          },
        },
      },
    });
  }

  static async createOrderWithItems(params: {
    orderId: string;
    grossAmount: number;
    appFee: number;
    midtransFee: number;
    selectedSlotId?: string | null;
    staffId?: string | null;
    outletId: string;
    customer: { name: string; phone: string };
    items: Array<{ productId: string; quantity: number }>;
  }) {
    const {
      orderId,
      grossAmount,
      appFee,
      midtransFee,
      selectedSlotId,
      staffId,
      outletId,
      customer,
      items,
    } = params;

    return db.$transaction(async (tr) => {
      let slotRecord: Prisma.BookingSlotGetPayload<{
        include: { productService: { include: { product: true } } };
      }> | null = null;

      if (selectedSlotId) {
        slotRecord = await tr.bookingSlot.findUnique({
          where: { id: selectedSlotId },
          include: {
            productService: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!slotRecord) {
          throw new AppError(Messages.BOOKING_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        if (slotRecord.status !== "AVAILABLE") {
          throw new AppError(Messages.BOOKING_SLOT_UNAVAILABLE, HttpStatus.BAD_REQUEST);
        }

        if (slotRecord.productService.product.outletId !== outletId) {
          throw new AppError("Slot booking tidak berada pada outlet ini.", HttpStatus.FORBIDDEN);
        }

        const slotProductId = slotRecord.productService.productId;
        if (!items.some((item) => item.productId === slotProductId)) {
          throw new AppError(
            "Slot booking tidak sesuai dengan produk yang dipilih.",
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (staffId) {
        const staff = await tr.staff.findUnique({
          where: { id: staffId },
          select: { id: true, outletId: true, status: true },
        });

        if (!staff) {
          throw new AppError("Staff tidak ditemukan.", HttpStatus.NOT_FOUND);
        }

        if (staff.outletId !== outletId) {
          throw new AppError("Staff tidak berasal dari outlet ini.", HttpStatus.FORBIDDEN);
        }

        if (staff.status !== StaffStatus.ACTIVE) {
          throw new AppError("Staff sedang tidak aktif.", HttpStatus.BAD_REQUEST);
        }
      }

      // if (slotRecord) {
      //   const start = new Date(slotRecord.startTime);
      //   const end = new Date(slotRecord.endTime);
      //
      //   const staffAvailability = await getStaffAvailabilityForWindow({
      //     outletId,
      //     startTime: start,
      //     endTime: end,
      //     excludeSlotId: selectedSlotId ?? undefined,
      //   });
      //
      //   if (!staffAvailability.some((staff) => staff.isAvailable)) {
      //     throw new AppError("Tidak ada staff yang tersedia untuk slot ini.", HttpStatus.CONFLICT);
      //   }
      // }

      const guestCustomer = await db.guestCustomer.upsert({
        where: { phone: customer.phone },
        create: {
          name: customer.name,
          phone: customer.phone,
        },
        update: {
          name: customer.name,
          phone: customer.phone,
        }
      })

      await tr.order.create({
        data: {
          id: orderId,
          totalAmount: grossAmount,
          appFee,
          midtransFee,
          bookingDate: slotRecord ? slotRecord.startTime : null,
          guestCustomer: {
            connect: { id: guestCustomer.id },
          },
          outlet: {
            connect: { id: outletId },
          },
          ...(staffId && {
            handledByStaff: {
              connect: { id: staffId },
            },
          }),
        },
      });

      let linkedSlotOrderItemId: string | null = null;

      for (const item of items) {
        const product = await tr.product.findUnique({
          where: { id: item.productId },
          include: { goods: true, service: true, ticket: true },
        });

        if (!product) {
          throw new AppError(
            `Produk dengan ID ${item.productId} tidak ditemukan`,
            HttpStatus.NOT_FOUND,
          );
        }

        if (product.type === "GOODS") {
          const stock = product.goods?.currentStock ?? 0;
          if (stock < item.quantity) {
            throw new AppError(
              `Stok tidak mencukupi untuk produk ${product.name}`,
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        if (product.type === "TICKET") {
          if (!product.ticket) {
            throw new AppError(
              `Data tiket tidak ditemukan untuk produk ${product.name}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          const availableQuota = product.ticket.totalQuota - product.ticket.soldCount;
          if (availableQuota < item.quantity) {
            throw new AppError(
              `Kuota tiket tidak cukup untuk ${product.name}. Tersisa: ${availableQuota}`,
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        const orderItem = await tr.orderItem.create({
          data: {
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            priceAtTimeOfOrder: PaymentRepository.resolveProductPrice(product),
          },
        });

        if (product.type === "GOODS") {
          await tr.productGoods.update({
            where: { productId: product.id },
            data: { currentStock: { decrement: item.quantity } },
          });
        }

        if (product.type === "TICKET" && product.ticket) {
          await tr.productTicket.update({
            where: { id: product.ticket.id },
            data: { soldCount: { increment: item.quantity } },
          });
        }

        if (
          product.type === "SERVICE" &&
          slotRecord &&
          slotRecord.productService.productId === product.id
        ) {
          linkedSlotOrderItemId = orderItem.id;
        }
      }

      if (slotRecord && linkedSlotOrderItemId && selectedSlotId) {
        await tr.bookingSlot.update({
          where: { id: selectedSlotId },
          data: {
            status: "BLOCKED",
            orderItemId: linkedSlotOrderItemId,
          },
        });
      }

      return true;
    });
  }

  static async restockAndCancelOrder(orderId: string) {
    return db.$transaction(async (tr) => {
      const order = await tr.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: { include: { goods: true, ticket: true } },
              bookingSlot: true,
            },
          },
        },
      });

      if (!order) {
        throw new AppError("Order tidak ditemukan", HttpStatus.NOT_FOUND);
      }

      for (const item of order.items) {
        if (item.product.type === "GOODS" && item.product.goods) {
          await tr.productGoods.update({
            where: { productId: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });
        }

        if (item.product.type === "TICKET" && item.product.ticket) {
          await tr.productTicket.update({
            where: { id: item.product.ticket.id },
            data: { soldCount: { decrement: item.quantity } },
          });
        }

        if (item.bookingSlot?.id) {
          await tr.bookingSlot.update({
            where: { id: item.bookingSlot.id },
            data: {
              status: "AVAILABLE",
              orderItemId: null,
            },
          });
        }
      }

      await tr.transaction.updateMany({ where: { orderId }, data: { status: "CANCELLED" } });

      await tr.order.update({
        where: { id: orderId },
        data: { orderStatus: "CANCELLED", paymentStatus: "CANCELLED" },
      });

      return true;
    });
  }

  static async createTransaction(data: {
    orderId: string;
    amount: number;
    status: PaymentStatus;
    externalId: string;
    paymentUrl?: string | null;
    expiresAt: Date;
  }) {
    return db.transaction.create({ data });
  }

  static async findTransactionWithOrder(orderId: string) {
    return db.transaction.findFirst({
      where: { orderId },
      include: { order: { include: { items: { include: { product: true } } } } },
    });
  }

  private static resolveProductPrice(product: ProductWithDetails): number {
    if (product.type === "GOODS") {
      return product.goods?.sellingPrice ?? 0;
    }
    if (product.type === "TICKET") {
      return product.ticket?.sellingPrice ?? 0;
    }
    return product.service?.sellingPrice ?? 0;
  }
}
