import { OrderStatus, Outlet, PaymentStatus, StaffStatus, Prisma } from "@prisma/client";
import { db } from "../config/prisma";
import { CreatePaymentInput } from "../schemas/payment.schema";
import { AppError } from "../errors/app-error";
import { Messages } from "../constants/message";
import { HttpStatus } from "../constants/http-status";
import { getStaffAvailabilityForWindow } from "../service/staff.service";

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    goods: true;
    service: true;
    ticket: true;
    recipe: {
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    }
  }
}>;

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
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        },
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
      include: {
        goods: true,
        service: true,
        ticket: true,
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        },
      },
    });

    if (!product) {
      return { available: false, product: null, message: "Produk tidak ditemukan" };
    }

    if (product.status !== "ACTIVE") {
      return { available: false, product, message: "Produk tidak aktif" };
    }

    if (product.type === "GOODS") {
      const hasRecipe = !!(product as any).recipe?.ingredients?.length;
      if (hasRecipe) {
        let minIngredientStock = Infinity;
        for (const recipeIngredient of (product as any).recipe.ingredients) {
          const ingStock = recipeIngredient.ingredient?.currentStock ?? 0;
          const ingQtyNeeded = recipeIngredient.quantity;
          if (ingQtyNeeded > 0) {
            const maxServings = Math.floor(ingStock / ingQtyNeeded);
            if (maxServings < minIngredientStock) {
              minIngredientStock = maxServings;
            }
          }
        }
        const dynamicStock = minIngredientStock === Infinity ? 0 : minIngredientStock;
        if (dynamicStock < quantity) {
          return {
            available: false,
            product,
            message: `Stok bahan baku tidak cukup. Tersedia: ${dynamicStock}`,
          };
        }
      } else {
        const stock = product.goods?.currentStock ?? 0;
        if (stock < quantity) {
          return {
            available: false,
            product,
            message: `Stok tidak mencukupi. Stok tersedia: ${stock}`,
          };
        }
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
    tableId?: string;
    tableNumber?: string;
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
      tableId,
      tableNumber,
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

      // Handle Bill integration if tableId is provided
      let billId: string | undefined = undefined;
      let resolvedTableNumber = tableNumber;

      if (tableId) {
        const table = await tr.outletTable.findUnique({ where: { id: tableId } });
        if (table) {
          if (!resolvedTableNumber) resolvedTableNumber = table.name;

          const activeBill = await tr.bill.findFirst({
            where: {
              tableId,
              status: { in: ["OPEN", "BILLED"] }
            }
          });

          if (activeBill) {
            billId = activeBill.id;
            await tr.bill.update({
              where: { id: billId },
              data: {
                total: { increment: grossAmount }
              }
            });
          } else {
            const newBill = await tr.bill.create({
              data: {
                outletId,
                tableId,
                total: grossAmount,
                status: "OPEN"
              }
            });
            billId = newBill.id;
          }

          // Update Table Status to OCCUPIED
          await tr.outletTable.update({
            where: { id: tableId },
            data: { status: "OCCUPIED" }
          });
        }
      }

      await tr.order.create({
        data: {
          id: orderId,
          totalAmount: grossAmount,
          appFee,
          midtransFee,
          bookingDate: slotRecord ? slotRecord.startTime : null,
          guestCustomerId: guestCustomer.id,
          outletId,
          tableId,
          tableNumber: resolvedTableNumber,
          billId,
          handledByStaffId: staffId || null,
        },
      });

      let linkedSlotOrderItemId: string | null = null;
      let totalTax = 0;

      for (const item of items) {
        const product = await tr.product.findUnique({
          where: { id: item.productId },
          include: {
            goods: true,
            service: true,
            ticket: true,
            recipe: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true
                  }
                }
              }
            }
          },
        });

        if (!product) {
          throw new AppError(
            `Produk dengan ID ${item.productId} tidak ditemukan`,
            HttpStatus.NOT_FOUND,
          );
        }

        if (product.taxPercentage && product.taxPercentage > 0) {
          const price = PaymentRepository.resolveProductPrice(product);
          totalTax += Math.round(price * item.quantity * (product.taxPercentage / 100));
        }

        if (product.type === "GOODS") {
          const hasRecipe = !!(product as any).recipe?.ingredients?.length;
          if (hasRecipe) {
            let minIngredientStock = Infinity;
            for (const recipeIngredient of (product as any).recipe.ingredients) {
              const ingStock = recipeIngredient.ingredient?.currentStock ?? 0;
              const ingQtyNeeded = recipeIngredient.quantity;
              if (ingQtyNeeded > 0) {
                const maxServings = Math.floor(ingStock / ingQtyNeeded);
                if (maxServings < minIngredientStock) {
                  minIngredientStock = maxServings;
                }
              }
            }
            const dynamicStock = minIngredientStock === Infinity ? 0 : minIngredientStock;
            if (dynamicStock < item.quantity) {
              throw new AppError(
                `Stok bahan baku tidak cukup untuk membuat ${product.name}. Tersedia: ${dynamicStock}`,
                HttpStatus.BAD_REQUEST,
              );
            }
          } else {
            const stock = product.goods?.currentStock ?? 0;
            if (stock < item.quantity) {
              throw new AppError(
                `Stok tidak mencukupi untuk produk ${product.name}`,
                HttpStatus.BAD_REQUEST,
              );
            }
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
          if (product.ticket.maxPerOrder && item.quantity > product.ticket.maxPerOrder) {
            throw new AppError(
              `Maksimal ${product.ticket.maxPerOrder} tiket per order untuk ${product.name}`,
              HttpStatus.BAD_REQUEST,
            );
          }
          if (product.ticket.maxPerOrder && customer?.phone) {
            const existingPurchase = await tr.orderItem.aggregate({
              where: {
                productId: item.productId,
                order: {
                  guestCustomer: {
                    phone: customer.phone,
                  },
                  orderStatus: {
                    not: OrderStatus.CANCELLED,
                  },
                },
              },
              _sum: {
                quantity: true,
              },
            });
            const alreadyPurchased = existingPurchase?._sum?.quantity || 0;
            if (alreadyPurchased + item.quantity > product.ticket.maxPerOrder) {
              throw new AppError(
                `Pembelian tiket untuk ${product.name} melebihi batas. Anda sudah membeli ${alreadyPurchased} tiket, batas maksimal adalah ${product.ticket.maxPerOrder} tiket per pelanggan.`,
                HttpStatus.BAD_REQUEST,
              );
            }
          }
        }

        const price = PaymentRepository.resolveProductPrice(product);
        const hpp = product?.goods?.averageHpp || 0;
        let commission = 0;
        if (product?.service) {
          const s = product.service;
          commission = s.commissionType === "PERCENTAGE"
            ? price * (s.commissionValue / 100)
            : s.commissionValue;
        }

        const orderItem = await tr.orderItem.create({
          data: {
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            priceAtTimeOfOrder: price,
            hppAtTimeOfOrder: hpp,
            commissionAtTimeOfOrder: commission,
          },
        });

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

      if (totalTax > 0) {
        await tr.order.update({
          where: { id: orderId },
          data: {
            taxAmount: totalTax,
          },
        });
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
