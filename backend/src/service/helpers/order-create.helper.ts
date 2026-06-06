import { Order, OrderStatus, Product, StaffStatus, Prisma } from "@prisma/client";
import { CreateOrderInput } from "../../schemas/order.schema";
import { AppError } from "../../errors/app-error";
import { Messages } from "../../constants/message";
import { HttpStatus } from "../../constants/http-status";
import { db } from "../../config/prisma";
import { getOutletByIdService } from "../outlet.service";
import { generateOrderCode, generateTicketCode } from "../../utils";
import { getBusinessByIdService } from "../business.service";
import { PlanLimitService } from "../plan-limit.service";

export interface OrderCreationResult {
  order: Order;
  midtransFee: number;
  appFee: number;
  feeBearer: "CUSTOMER" | "OWNER";
  totalAmount: number;
  taxAmount: number;
}

/**
 * Creates an order record, validates item availability, handles service bookings,
 * manages stock for goods, and calculates transaction fees.
 */
export async function createOrderRecord(data: CreateOrderInput): Promise<OrderCreationResult> {
  const { items, outletId, bookingSlotId, staffId, cashierId, tableId } = data;

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

  // 2. Validate Staff (Service Provider) if provided
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

  // 3. Validate Cashier if provided
  if (cashierId) {
    const cashier = await db.staff.findUnique({
      where: { id: cashierId },
      select: { id: true, status: true, outletId: true },
    });

    if (!cashier) throw new AppError("Cashier not found.", HttpStatus.NOT_FOUND);
    if (cashier.outletId !== outletId)
      throw new AppError("Cashier does not belong to this outlet.", HttpStatus.FORBIDDEN);
    // Note: Cashier status check might be needed but assuming logged in cashier is active
  }

  // Prioritize cashierId for the order handler, fallback to staffId (service provider) if legacy behavior needed
  const handledByStaffId = cashierId ?? staffId ?? null;
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

  // SECURITY: Validate that the business subscription is active and not expired
  await PlanLimitService.assertSubscriptionActive(business.id);

  // 4. Start Transaction for Atomic Order Creation
  try {
    return await db.$transaction(async (tx) => {
      let subTotal = 0;
      const productDetails: any[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
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
          const hasRecipe = !!(product as any).recipe;
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
            if (product.goods.currentStock < item.quantity) {
              throw new AppError(
                `Insufficient stock for ${product.name}. Available: ${product.goods.currentStock}`,
                HttpStatus.BAD_REQUEST,
              );
            }
          }
          price = product.goods.sellingPrice;
        } else if (product.type === "TICKET") {
          if (!product.ticket)
            throw new AppError(
              `Data missing for ticket: ${product.name}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
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
          if (product.ticket.maxPerOrder && data.guestCustomer?.phone) {
            const cleanPhone = data.guestCustomer.phone.replace(/[^\d+]/g, "");
            const existingPurchase = await tx.orderItem.aggregate({
              where: {
                productId: item.productId,
                order: {
                  guestCustomer: {
                    phone: cleanPhone,
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
          if (new Date(product.ticket.eventDate) < new Date()) {
            throw new AppError(
              `Event untuk ${product.name} sudah berakhir`,
              HttpStatus.BAD_REQUEST,
            );
          }
          if (product.ticket.saleEndDate && new Date(product.ticket.saleEndDate) < new Date()) {
            throw new AppError(
              `Penjualan tiket untuk ${product.name} sudah ditutup`,
              HttpStatus.BAD_REQUEST,
            );
          }
          if (product.ticket.saleStartDate && new Date(product.ticket.saleStartDate) > new Date()) {
            throw new AppError(
              `Penjualan tiket untuk ${product.name} belum dibuka`,
              HttpStatus.BAD_REQUEST,
            );
          }
          price = product.ticket.sellingPrice;
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

      // Tax Calculation per item
      let totalTax = 0;
      for (const prod of productDetails) {
        const itemQty = prod.orderQuantity ?? 1;
        const itemPrice = prod.type === "GOODS"
          ? prod.goods?.sellingPrice
          : prod.type === "TICKET"
            ? prod.ticket?.sellingPrice
            : prod.service?.sellingPrice;
        const taxPct = (prod as any).taxPercentage;
        if (taxPct != null && taxPct > 0 && itemPrice != null) {
          totalTax += Math.round(itemPrice * itemQty * (taxPct / 100));
        }
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
      const totalAmount = subTotal + totalTax;

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

      // 6.5 Handle Bill integration if tableId is provided
      let billId: string | undefined = undefined;
      if (tableId) {
        const activeBill = await tx.bill.findFirst({
          where: {
            tableId,
            status: { in: ["OPEN", "BILLED"] }
          }
        });

        if (activeBill) {
          billId = activeBill.id;
          await tx.bill.update({
            where: { id: billId },
            data: {
              total: { increment: totalAmount }
            }
          });
        } else {
          const newBill = await tx.bill.create({
            data: {
              outletId,
              tableId,
              total: totalAmount,
              status: "OPEN"
            }
          });
          billId = newBill.id;
        }

        // Update Table Status to OCCUPIED
        await tx.outletTable.update({
          where: { id: tableId },
          data: { status: "OCCUPIED" }
        });
      }

      // 7. Finalize Records
      const order = await tx.order.create({
        data: {
          id: generateOrderCode({ name: outlet.name, maxLength: 12 }, { randomLength: 6 }),
          guestCustomerId: customer.id,
          outletId,
          totalAmount,
          taxAmount: totalTax,
          midtransFee,
          appFee,
          paymentStatus: data.paymentMethod === "cash" ? "SUCCESS" : "PENDING",
          bookingDate: slotStart ?? (data.bookingDate ? new Date(data.bookingDate) : null),
          orderStatus: !bookingSlotId && data.paymentMethod === "cash" ? "COMPLETED" : "CONFIRMED",
          handledByStaffId: handledByStaffId,
          tableNumber: data.tableNumber || (tableId ? (await tx.outletTable.findUnique({ where: { id: tableId } }))?.name : null),
          tableId: tableId,
          billId: billId,
        },
      });

      // Create OrderItems individually to get their IDs and record historical costs
      const createdItems = await Promise.all(
        items.map(async (item) => {
          const prod = productDetails.find((p) => p.id === item.productId);
          
          const price =
            prod?.type === "GOODS"
              ? prod.goods.sellingPrice
              : prod?.type === "TICKET"
                ? prod.ticket.sellingPrice
                : prod.service.sellingPrice;

          // Calculate historical HPP (for GOODS)
          const hpp = prod?.type === "GOODS" ? (prod.goods.averageHpp || 0) : 0;

          // Calculate historical Commission (for SERVICE)
          let commission = 0;
          if (prod?.type === "SERVICE" && prod.service) {
            const s = prod.service;
            commission = s.commissionType === "PERCENTAGE"
              ? price * (s.commissionValue / 100)
              : s.commissionValue;
          }

          return await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              priceAtTimeOfOrder: price,
              hppAtTimeOfOrder: hpp,
              commissionAtTimeOfOrder: commission,
            },
          });
        }),
      );

      // 8. Quota Updates (Tickets only)
      for (const item of items) {
        const prod = productDetails.find((p) => p.id === item.productId);
        
        // Increment soldCount for TICKET products (this is quota, not physical stock)
        if (prod?.type === "TICKET" && prod.ticket) {
          await tx.productTicket.update({
            where: { id: prod.ticket.id },
            data: { soldCount: { increment: item.quantity } },
          });

          // Generate TicketCode records for each ticket quantity
          const createdItem = createdItems.find((ci) => ci.productId === item.productId);
          if (createdItem) {
            const ticketCodes = Array.from({ length: item.quantity }, () => ({
              code: generateTicketCode(),
              orderItemId: createdItem.id,
            }));
            await tx.ticketCode.createMany({ data: ticketCodes });
          }
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

      return { order, midtransFee, appFee, feeBearer: "CUSTOMER", totalAmount, taxAmount: totalTax };
    });
  } catch (error) {
    console.error("[POS Order Create Error] Payload:", JSON.stringify(data, null, 2));
    console.error("[POS Order Create Error] Detail:", error);
    throw error;
  }
}
