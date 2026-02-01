import { Order, OrderStatus, Product, StaffStatus, Prisma } from "@prisma/client";
import { CreateOrderInput } from "../../schemas/order.schema";
import { AppError } from "../../errors/app-error";
import { Messages } from "../../constants/message";
import { HttpStatus } from "../../constants/http-status";
import { db } from "../../config/prisma";
import { getOutletByIdService } from "../outlet.service";
import { generateOrderCode } from "../../utils";
import { getBusinessByIdService } from "../business.service";

export interface OrderCreationResult {
  order: Order;
  midtransFee: number;
  appFee: number;
  feeBearer: "CUSTOMER" | "OWNER";
  totalAmount: number;
}

/**
 * Creates an order record, validates item availability, handles service bookings,
 * manages stock for goods, and calculates transaction fees.
 */
export async function createOrderRecord(data: CreateOrderInput): Promise<OrderCreationResult> {
  const { items, outletId, bookingSlotId, staffId } = data;

  // 1. Validate Booking Slot if provided
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
      throw new AppError("Slot booking does not belong to this outlet.", HttpStatus.FORBIDDEN);
    }
  }

  // 2. Validate Staff if provided
  if (staffId) {
    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: { id: true, status: true, outletId: true },
    });

    if (!staff) throw new AppError("Staff not found.", HttpStatus.NOT_FOUND);
    if (staff.outletId !== outletId)
      throw new AppError("Staff does not belong to this outlet.", HttpStatus.FORBIDDEN);
    if (staff.status !== StaffStatus.ACTIVE)
      throw new AppError("Staff is currently inactive.", HttpStatus.BAD_REQUEST);
  }

  const handledByStaffId = staffId ?? null;
  const slotStart = slot ? new Date(slot.startTime) : null;
  const slotEnd = slot ? new Date(slot.endTime) : null;
  let slotMaxParallel: number | null = null;

  // 3. Perform Availability Checks for Slot-based orders
  if (slot && slotStart && slotEnd) {
    const maxParallel = slot.productService.maxParallel ?? 1;
    slotMaxParallel = maxParallel;

    const activeBookings = await db.bookingSlot.count({
      where: {
        productServiceId: slot.productService.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        orderItemId: { not: null },
      },
    });

    if (activeBookings >= maxParallel) {
      throw new AppError("This slot is fully booked.", HttpStatus.CONFLICT);
    }
  }

  const outlet = await getOutletByIdService(outletId);
  const business = await getBusinessByIdService(outlet.businessId);

  // 4. Start Transaction for Atomic Order Creation
  try {
    return await db.$transaction(async (tx) => {
      let subTotal = 0;
      const productDetails: any[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { goods: true, service: true },
        });

        if (!product || product.outletId !== outletId || product.status !== "ACTIVE") {
          throw new AppError(
            `Product ${item.productId} is unavailable or inactive.`,
            HttpStatus.BAD_REQUEST,
          );
        }

        let price: number;
        if (product.type === "GOODS") {
          if (!product.goods)
            throw new AppError(
              `Data missing for goods: ${product.name}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          if (product.goods.currentStock < item.quantity) {
            throw new AppError(
              `Insufficient stock for ${product.name}. Available: ${product.goods.currentStock}`,
              HttpStatus.BAD_REQUEST,
            );
          }
          price = product.goods.sellingPrice;
        } else {
          if (!product.service)
            throw new AppError(
              `Data missing for service: ${product.name}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          price = product.service.sellingPrice;
        }

        subTotal += price * item.quantity;
        productDetails.push({ ...product, orderQuantity: item.quantity });
      }

      // Amount Constraints
      if (subTotal < 1000) throw new AppError("Minimum order is Rp 1.000", HttpStatus.BAD_REQUEST);
      if (subTotal > 50000000)
        throw new AppError("Maximum order is Rp 50.000.000", HttpStatus.BAD_REQUEST);

      // Fee Calculations
      const isDigitalPayment =
        data.paymentMethod === "online" ||
        (data.paymentMethod === "qris" && !!data.onlinePaymentChannel);
      const midtransFee = isDigitalPayment ? Math.ceil(subTotal * 0.02) : 0;
      const appFee = isDigitalPayment ? Math.ceil(subTotal * 0.03) : 0;
      const totalAmount = subTotal;

      // 5. Check overlapping bookings for ad-hoc (non-slot) service orders
      const serviceItems = productDetails.filter((p) => p.type === "SERVICE");
      if (serviceItems.length > 0 && !bookingSlotId) {
        if (!data.bookingDate)
          throw new AppError("Service bookings require a date/time.", HttpStatus.BAD_REQUEST);

        const requestedStart = new Date(data.bookingDate);
        for (const svc of serviceItems) {
          const durationMin = svc.service?.durationMinutes ?? 60;
          const requestedEnd = new Date(requestedStart.getTime() + durationMin * 60000);
          const maxParallel = svc.service?.maxParallel ?? 1;

          const existingOverlaps = await tx.bookingSlot.count({
            where: {
              productServiceId: svc.service.id,
              orderItemId: { not: null },
              OR: [
                {
                  AND: [
                    { startTime: { lte: requestedStart } },
                    { endTime: { gt: requestedStart } },
                  ],
                },
                {
                  AND: [{ startTime: { lt: requestedEnd } }, { endTime: { gte: requestedEnd } }],
                },
                {
                  AND: [{ startTime: { gte: requestedStart } }, { endTime: { lte: requestedEnd } }],
                },
              ],
            },
          });

          if (existingOverlaps >= maxParallel) {
            throw new AppError(
              `No capacity left for ${svc.name} at the requested time.`,
              HttpStatus.CONFLICT,
            );
          }
        }
      }

      // 6. Customer Management
      let customer = await tx.guestCustomer.findFirst({
        where: { phone: data.guestCustomer.phone },
      });
      if (!customer) {
        customer = await tx.guestCustomer.create({
          data: {
            name: data.guestCustomer.name.trim(),
            phone: data.guestCustomer.phone.replace(/[^\d+]/g, ""),
          },
        });
      }

      // 7. Finalize Records
      const order = await tx.order.create({
        data: {
          id: generateOrderCode({ name: outlet.name, maxLength: 12 }, { randomLength: 6 }),
          guestCustomerId: customer.id,
          outletId,
          totalAmount,
          midtransFee,
          appFee,
          paymentStatus: data.paymentMethod === "cash" ? "SUCCESS" : "PENDING",
          bookingDate: slotStart ?? (data.bookingDate ? new Date(data.bookingDate) : null),
          orderStatus: !bookingSlotId && data.paymentMethod === "cash" ? "COMPLETED" : "CONFIRMED",
          handledByStaffId: handledByStaffId,
        },
      });

      // Create OrderItems individually to get their IDs
      const createdItems = await Promise.all(
        items.map(async (item) => {
          const prod = productDetails.find((p) => p.id === item.productId);
          const price =
            prod?.type === "GOODS" ? prod.goods.sellingPrice : prod.service.sellingPrice;

          return await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              priceAtTimeOfOrder: price,
            },
          });
        }),
      );

      // 8. Stock & Slot Updates
      for (const item of items) {
        const prod = productDetails.find((p) => p.id === item.productId);
        if (prod?.type === "GOODS" && prod.goods) {
          await tx.stockLog.create({
            data: {
              productGoodsId: prod.goods.id,
              type: "OUT",
              quantity: item.quantity,
              referenceType: "ORDER",
              referenceId: order.id,
              notes: `Auto-stock out for order ${order.id}`,
            },
          });
          await tx.productGoods.update({
            where: { id: prod.goods.id },
            data: { currentStock: { decrement: item.quantity } },
          });
        }
      }

      // Link BookingSlot to the service OrderItem
      if (slot) {
        const serviceItem = createdItems.find((createdItem) => {
          const prod = productDetails.find((p) => p.id === createdItem.productId);
          return prod?.type === "SERVICE";
        });

        if (serviceItem) {
          await tx.bookingSlot.update({
            where: { id: bookingSlotId },
            data: {
              status: "BOOKED",
              orderItemId: serviceItem.id,
            },
          });
        }
      }

      return { order, midtransFee, appFee, feeBearer: "CUSTOMER", totalAmount };
    });
  } catch (error) {
    console.error("[POS Order Create Error] Payload:", JSON.stringify(data, null, 2));
    console.error("[POS Order Create Error] Detail:", error);
    throw error;
  }
}
