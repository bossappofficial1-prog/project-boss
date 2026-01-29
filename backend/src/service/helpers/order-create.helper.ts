import { Order, OrderStatus, Product, StaffStatus } from "@prisma/client";
import { db } from "../../config/prisma";
import { AppError } from "../../errors/app-error";
import { Messages } from "../../constants/message";
import { HttpStatus } from "../../constants/http-status";
import { getOutletByIdService } from "../outlet.service";
import { getBusinessByIdService } from "../business.service";
import { generateOrderCode } from "../../utils";
import { CreateOrderInput } from "../../schemas/order.schema";
import { getStaffAvailabilityForWindow } from "../staff.service";
import { recordStockOut, recordReturn } from "../stock.service";

export interface OrderCreationResult {
  order: Order;
  midtransFee: number;
  appFee: number;
  feeBearer: "CUSTOMER" | "OWNER";
  totalAmount: number;
}

export async function createOrderRecord(data: CreateOrderInput): Promise<OrderCreationResult> {
  const { items, outletId, bookingSlotId, staffId } = data;

  const slot = bookingSlotId
    ? await db.bookingSlot.findUnique({
        where: { id: bookingSlotId },
        include: {
          productService: {
            include: { product: true },
          },
        },
      })
    : null;

  if (bookingSlotId) {
    if (!slot) {
      throw new AppError(Messages.BOOKING_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (slot.status === "BLOCKED") {
      throw new AppError(Messages.BOOKING_SLOT_UNAVAILABLE, HttpStatus.BAD_REQUEST);
    }
    if (slot.productService.product.outletId !== outletId) {
      throw new AppError("Slot booking tidak berada pada outlet ini.", HttpStatus.FORBIDDEN);
    }
  }

  if (staffId) {
    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        status: true,
        role: true,
        outletId: true,
      },
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

  // Staff assignment is now done via Order.handledByStaffId, not via BookingSlot
  const handledByStaffId = staffId ?? null;

  const slotStart = slot ? new Date(slot.startTime) : null;
  const slotEnd = slot ? new Date(slot.endTime) : null;
  let slotMaxParallel: number | null = null;

  if (slot) {
    if (!slotStart || !slotEnd) {
      throw new AppError(
        "Slot booking tidak memiliki rentang waktu yang valid.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const staffAvailability = await getStaffAvailabilityForWindow({
      outletId,
      startTime: slotStart,
      endTime: slotEnd,
    });

    const totalStaffCount = staffAvailability.length;
    const availableStaffCount = staffAvailability.filter((member) => member.isAvailable).length;

    if (totalStaffCount <= 0) {
      throw new AppError("Belum ada staff yang ditugaskan untuk layanan ini.", HttpStatus.CONFLICT);
    }

    if (availableStaffCount <= 0) {
      throw new AppError("Tidak ada staff yang tersedia untuk slot ini.", HttpStatus.CONFLICT);
    }

    // Get maxParallel from ProductService
    const maxParallel = slot.productService.maxParallel ?? 1;
    slotMaxParallel = maxParallel;

    const activeBookings = await db.bookingSlot.count({
      where: {
        productServiceId: slot.productService.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        orderId: { not: null },
      },
    });

    if (activeBookings >= maxParallel) {
      throw new AppError("Slot ini sudah penuh.", HttpStatus.CONFLICT);
    }

    if (handledByStaffId) {
      const isStaffAvailable = staffAvailability.some(
        (member) => member.id === handledByStaffId && member.isAvailable,
      );

      if (!isStaffAvailable) {
        throw new AppError("Staff tidak tersedia pada waktu yang dipilih.", HttpStatus.CONFLICT);
      }
    }
  }

  const outlet = await getOutletByIdService(outletId);
  const business = await getBusinessByIdService(outlet.businessId);

  return db.$transaction(async (tx) => {
    let subTotal = 0;
    const productDetails: (Product & { orderQuantity: number })[] = [];

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: {
          goods: true,
          service: true,
        },
      });

      if (!product) {
        throw new AppError(
          `Produk dengan ID ${item.productId} tidak ditemukan`,
          HttpStatus.NOT_FOUND,
        );
      }

      if (product.outletId !== outletId) {
        throw new AppError(
          `Produk ${product.name} tidak tersedia di outlet ini`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (product.status !== "ACTIVE") {
        throw new AppError(`Produk ${product.name} tidak aktif`, HttpStatus.BAD_REQUEST);
      }

      if (item.quantity <= 0 || item.quantity > 1000) {
        throw new AppError(
          `Quantity tidak valid untuk produk ${product.name}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get price based on product type
      let price: number;
      if (product.type === "GOODS") {
        if (!product.goods) {
          throw new AppError(
            `Data produk GOODS tidak lengkap untuk ${product.name}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        price = product.goods.sellingPrice;

        // Check stock availability
        if (product.goods.currentStock < item.quantity) {
          throw new AppError(
            `Stok produk ${product.name} tidak mencukupi. Tersedia: ${product.goods.currentStock}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      } else if (product.type === "SERVICE") {
        if (!product.service) {
          throw new AppError(
            `Data produk SERVICE tidak lengkap untuk ${product.name}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        price = product.service.sellingPrice;
      } else {
        throw new AppError(
          `Tipe produk tidak valid untuk ${product.name}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      subTotal += price * item.quantity;
      productDetails.push({
        ...product,
        orderQuantity: item.quantity,
      } as any);
    }

    if (subTotal < 1000) {
      throw new AppError("Minimum order adalah Rp 1.000", HttpStatus.BAD_REQUEST);
    }
    if (subTotal > 50000000) {
      throw new AppError("Maximum order adalah Rp 50.000.000", HttpStatus.BAD_REQUEST);
    }

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 100) {
      throw new AppError("Terlalu banyak item dalam satu pesanan", HttpStatus.BAD_REQUEST);
    }

    const averageItemPrice = subTotal / totalItems;
    if (averageItemPrice > 1000000) {
      console.warn(
        `[SUSPICIOUS ORDER] High average item price: ${averageItemPrice} for phone: ${data.guestCustomer.phone.slice(-4)}`,
      );
    }

    const isDigitalPayment =
      data.paymentMethod === "online" ||
      (data.paymentMethod === "qris" && Boolean(data.onlinePaymentChannel));
    const midtransFee = isDigitalPayment ? Math.ceil(subTotal * 0.02) : 0;
    const appFee = isDigitalPayment ? Math.ceil(subTotal * 0.03) : 0;
    const feeBearer = business.defaultTransactionFeeBearer;
    let totalAmount = subTotal;

    if (feeBearer === "CUSTOMER" && isDigitalPayment) {
      totalAmount += midtransFee + appFee;
    }

    if (totalAmount > 5000000) {
      console.warn(
        `[HIGH VALUE ORDER] Amount: ${totalAmount} for phone: ${data.guestCustomer.phone.slice(-4)}`,
      );
    }

    const serviceItems = productDetails.filter((p) => p.type === "SERVICE");
    if (serviceItems.length > 0 && !bookingSlotId) {
      if (!data.bookingDate) {
        throw new AppError("Booking jasa wajib memiliki waktu booking.", HttpStatus.BAD_REQUEST);
      }

      const requestedStart = new Date(data.bookingDate);
      const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
        aStart < bEnd && bStart < aEnd;

      for (const svc of serviceItems) {
        const durationMin = svc.service?.durationMinutes ?? 60;
        const requestedEnd = new Date(requestedStart.getTime() + durationMin * 60000);

        const maxParallel = svc.service?.maxParallel ?? 1;

        const activeStatuses = [
          OrderStatus.AWAITING_PAYMENT,
          OrderStatus.PROCESSING,
          OrderStatus.READY,
          OrderStatus.CONFIRMED,
        ];

        const existing = await tx.order.findMany({
          where: {
            outletId,
            orderStatus: { in: activeStatuses },
            items: { some: { productId: svc.id } },
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    service: true,
                  },
                },
              },
            },
          },
        });

        let overlapping = 0;
        let staffConflict = false;
        for (const ex of existing) {
          let exStart: Date | null = null;
          let exEnd: Date | null = null;

          if (ex.bookingSlot) {
            exStart = new Date(ex.bookingSlot.startTime);
            exEnd = new Date(ex.bookingSlot.endTime);
          } else if (ex.bookingDate) {
            const exItem = ex.items.find((it) => it.product.id === svc.id);
            const exDuration = exItem?.product.serviceDurationMinutes ?? durationMin;
            exStart = new Date(ex.bookingDate);
            exEnd = new Date(exStart.getTime() + (exDuration ?? 60) * 60000);
          }

          if (exStart && exEnd && overlaps(requestedStart, requestedEnd, exStart, exEnd)) {
            overlapping += 1;
            if (handledByStaffId) {
              const existingStaffId = ex.handledByStaffId ?? null;
              if (existingStaffId === handledByStaffId) {
                staffConflict = true;
              }
            }
            if (overlapping >= maxParallel) break;
          }
        }

        if (overlapping >= maxParallel) {
          throw new AppError(
            `Waktu booking bentrok untuk layanan ${svc.name}. Silakan pilih waktu lain.`,
            HttpStatus.CONFLICT,
          );
        }

        if (staffConflict) {
          throw new AppError("Staff tidak tersedia pada waktu yang dipilih.", HttpStatus.CONFLICT);
        }
      }
    }

    let customer = await tx.guestCustomer.findFirst({
      where: { phone: data.guestCustomer.phone },
    });

    if (!customer) {
      const sanitizedGuestData = {
        name: data.guestCustomer.name.trim().replace(/\s+/g, " "),
        phone: data.guestCustomer.phone.replace(/[^\d+]/g, ""),
      };

      if (sanitizedGuestData.name.length < 2 || sanitizedGuestData.name.length > 100) {
        throw new AppError("Nama tidak valid", HttpStatus.BAD_REQUEST);
      }

      if (sanitizedGuestData.phone.length < 10 || sanitizedGuestData.phone.length > 15) {
        throw new AppError("Nomor telepon tidak valid", HttpStatus.BAD_REQUEST);
      }

      customer = await tx.guestCustomer.create({
        data: sanitizedGuestData,
      });

      console.log(
        `[NEW GUEST] Created guest customer with phone ending: ${sanitizedGuestData.phone.slice(-4)}`,
      );
    } else {
      console.log(
        `[RETURNING GUEST] Found existing customer with phone ending: ${customer.phone?.slice(-4) || "unknown"}`,
      );
    }

    const order = await tx.order.create({
      data: {
        id: generateOrderCode({ name: outlet.name, maxLength: 12 }, { randomLength: 6 }),
        guestCustomerId: customer.id,
        outletId,
        totalAmount,
        midtransFee,
        appFee,
        // Note: chargedTo field doesn't exist in Order model anymore
        paymentStatus: `SUCCESS`,
        bookingDate: slotStart ?? (data.bookingDate ? new Date(data.bookingDate) : null),
        orderStatus:
          !data.bookingSlotId && (data.paymentMethod == "cash" || data.paymentMethod == "qris")
            ? "COMPLETED"
            : "CONFIRMED",
        handledByStaffId: handledByStaffId,
      },
    });

    await tx.orderItem.createMany({
      data: items.map((item) => {
        const prod = productDetails.find((p) => p.id === item.productId);
        const price =
          prod?.type === "GOODS" ? prod.goods?.sellingPrice : prod?.service?.sellingPrice;
        return {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTimeOfOrder: price || 0,
        };
      }),
    });

    // Record stock OUT for GOODS items
    for (const item of items) {
      const product = productDetails.find((p) => p.id === item.productId);
      if (product && product.type === "GOODS" && product.goods) {
        // Create stock log
        await tx.stockLog.create({
          data: {
            productGoodsId: product.goods.id,
            type: "OUT",
            quantity: item.quantity,
            referenceType: "ORDER",
            referenceId: order.id,
            notes: `Stock OUT for order ${order.id}`,
          },
        });

        // Decrease current stock
        await tx.productGoods.update({
          where: { id: product.goods.id },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    if (slot) {
      const activeBookingsForTx = await tx.bookingSlot.count({
        where: {
          productServiceId: slot.productService.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          orderId: { not: null },
        },
      });

      const maxParallelForTx = slotMaxParallel ?? 1;

      if (activeBookingsForTx >= maxParallelForTx) {
        throw new AppError("Slot ini sudah penuh.", HttpStatus.CONFLICT);
      }

      // Create new booking slot for this order
      await tx.bookingSlot.create({
        data: {
          productServiceId: slot.productService.id,
          date: new Date(slot.date),
          startTime: slotStart!,
          endTime: slotEnd!,
          status: "BOOKED",
          orderId: order.id,
        },
      });
    }

    try {
      await tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: { product: true },
          },
          guestCustomer: true,
          outlet: true,
        },
      });
    } catch (socketError) {
      console.error("❌ Error emitting new_order event:", socketError);
    }

    return { order, midtransFee, appFee, feeBearer, totalAmount };
  });
}
