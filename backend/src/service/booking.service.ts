import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { BookingRepository } from "../repositories/booking.repository";
import { CreateBookingSlotInput, UpdateBookingSlotInput } from "../schemas/booking.schema";
import { getProductByIdService } from "./product.service";
import { createMidtransTransactionService } from "./payment.service";
import { getOrderByIdService } from "./order.service";
import { db } from "../config/prisma";
import { Prisma, OutletOperatingHours, BookingSlot } from "@prisma/client";
import { add, set } from "date-fns";
import { getOutletByIdService } from "./outlet.service";
import { getStaffAvailabilityForWindow, StaffAvailabilityResult } from "./staff.service";

/**
 * Creates a single booking slot after verifying the product is a SERVICE.
 */
export async function createBookingSlotService(data: CreateBookingSlotInput) {
  const product = await getProductByIdService(data.productId);
  if (product.type !== "SERVICE" || !product.service) {
    throw new AppError(
      "Booking slots can only be created for SERVICE type products.",
      HttpStatus.BAD_REQUEST,
    );
  }

  const { productId, ...slotData } = data;
  const bookingSlot = await BookingRepository.create({
    ...slotData,
    productServiceId: product.service.id,
  });
  return bookingSlot;
}

/**
 * Handles the combined logic of creating a booking and initializing Midtrans payment.
 */
export async function createBookingAndMidtransTransactionService(
  data: CreateBookingSlotInput,
  orderId: string,
) {
  const bookingSlot = await createBookingSlotService(data);

  // Get order details to calculate fees
  const order = await getOrderByIdService(orderId);

  // Fee calculation logic
  const midtransFee = Math.round(order.totalAmount * 0.007); // 0.7%
  const appFee = Math.round(order.totalAmount * 0.02); // 2%

  const paymentMethod: "online" | "qris" = "qris";
  const chargedTo = "customer" as "customer" | "owner";

  // Total amount including fees
  const finalAmount = order.totalAmount + midtransFee + appFee;

  const midtransTransaction = await createMidtransTransactionService(
    orderId,
    finalAmount,
    midtransFee,
    appFee,
    paymentMethod,
    chargedTo,
  );

  await db.order.update({
    where: { id: orderId },
    data: {
      midtransTransactionToken: midtransTransaction.token,
      midtransRedirectUrl: midtransTransaction.redirect_url,
      bookingSlot: {
        connect: {
          id: bookingSlot.id,
        },
      },
    },
  });

  return { bookingSlot, midtransTransaction };
}

export async function getBookingSlotByIdService(id: string) {
  const bookingSlot = await BookingRepository.findById(id);
  if (!bookingSlot) {
    throw new AppError(Messages.BOOKING_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
  return bookingSlot;
}

export async function getBookingSlotsByProductServiceIdService(productServiceId: string) {
  const bookingSlots = await BookingRepository.findByProductServiceId(productServiceId);
  return bookingSlots;
}

export async function updateBookingSlotService(id: string, data: UpdateBookingSlotInput) {
  await getBookingSlotByIdService(id);
  const bookingSlot = await BookingRepository.update(id, data);
  return bookingSlot;
}

export async function deleteBookingSlotService(id: string) {
  await getBookingSlotByIdService(id);
  const bookingSlot = await BookingRepository.delete(id);
  return bookingSlot;
}

type BookingSlotWithStaff = Pick<
  BookingSlot,
  "id" | "date" | "startTime" | "endTime" | "status" | "productServiceId"
> & {
  availableStaffCount: number;
  totalStaffCount: number;
};

/**
 * Retrieves booking slots for a product on a specific date.
 * Generates slots if none exist and calculates staff availability capped by maxParallel.
 */
export async function getBookingSlotByProductService(
  productId: string,
  date: Date,
): Promise<BookingSlotWithStaff[]> {
  const product = await getProductByIdService(productId);

  if (product.type !== "SERVICE") {
    throw new AppError(
      "Slots can only be generated for SERVICE type products.",
      HttpStatus.BAD_REQUEST,
    );
  }

  const outletId = product.outletId;
  if (!outletId) {
    throw new AppError("Product does not have an associated outletId.", HttpStatus.BAD_REQUEST);
  }

  // Get maxParallel capacity from ProductService
  const maxParallel = product.service?.maxParallel ?? 1;

  // Get ProductService ID
  const productServiceId = product.service?.id;
  if (!productServiceId) {
    throw new AppError("Product service data not found", HttpStatus.NOT_FOUND);
  }

  let slots = await BookingRepository.getSlotsByProductServiceId(productServiceId, date);

  // Generate slots if they haven't been created yet for this date
  if (!slots.length) {
    const serviceDurationMinutes = product.service?.durationMinutes ?? 60;
    const outlet = await getOutletByIdService(outletId);

    await generateSlotsForDate({
      productId,
      operatingHours: outlet.operatingHours,
      serviceDurationMinutes,
      date,
    });

    slots = await BookingRepository.getSlotsByProductServiceId(productServiceId, date);
  }

  // Determine status based on booking
  return slots.map((slot) => {
    let derivedStatus: BookingSlot["status"] = slot.status;

    if (slot.status === "AVAILABLE" && (slot as any).orderItemId) {
      derivedStatus = "BOOKED";
    }

    return {
      ...slot,
      status: derivedStatus,
      availableStaffCount: 1, // Dummy value as we don't track this anymore
      totalStaffCount: 1, // Dummy value
    };
  });
}

export async function getAvailableStaffForProductSlotService(params: {
  productId: string;
  outletId: string;
  startTime: Date;
  endTime: Date;
  excludeSlotId?: string;
}): Promise<StaffAvailabilityResult[]> {
  const { outletId, startTime, endTime, excludeSlotId } = params;

  if (endTime <= startTime) {
    throw new AppError("End time must be greater than start time", HttpStatus.BAD_REQUEST);
  }

  return getStaffAvailabilityForWindow({
    outletId,
    startTime,
    endTime,
    excludeSlotId,
  });
}

type GenerateSlotsForDateParams = {
  productId: string;
  operatingHours: OutletOperatingHours[];
  serviceDurationMinutes: number;
  date: Date;
};

/**
 * Logic to generate specific time slots for a single date based on operating hours.
 */
export async function generateSlotsForDate({
  productId,
  operatingHours,
  serviceDurationMinutes,
  date,
}: GenerateSlotsForDateParams) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { service: true },
  });

  if (!product?.service) {
    throw new AppError("Product Service data not found", HttpStatus.NOT_FOUND);
  }

  const slotsToCreate: Prisma.BookingSlotCreateManyInput[] = [];
  const dayOfWeek = date.getDay();

  const workHours = operatingHours.find((h) => h.dayOfWeek === dayOfWeek && h.isOpen);
  if (!workHours) return;

  const open = new Date(workHours.openTime);
  const close = new Date(workHours.closeTime);

  let slotStart = set(date, {
    hours: open.getHours(),
    minutes: open.getMinutes(),
    seconds: 0,
    milliseconds: 0,
  });

  let slotClose = set(date, {
    hours: close.getHours(),
    minutes: close.getMinutes(),
    seconds: 0,
    milliseconds: 0,
  });

  if (slotClose <= slotStart) {
    slotClose = add(slotClose, { days: 1 });
  }

  while (add(slotStart, { minutes: serviceDurationMinutes }) <= slotClose) {
    const slotEnd = add(slotStart, { minutes: serviceDurationMinutes });

    slotsToCreate.push({
      productServiceId: product.service.id,
      date,
      startTime: slotStart,
      endTime: slotEnd,
      status: "AVAILABLE",
    });

    slotStart = slotEnd;
  }

  if (slotsToCreate.length > 0) {
    await BookingRepository.createMany(slotsToCreate as any);
  }
}

type GenerateSlotsParams = {
  productId: string;
  operatingHours: OutletOperatingHours[];
  serviceDurationMinutes: number;
  daysToGenerate: number;
};

/**
 * Generates default booking slots for a range of days.
 */
export async function generateDefaultBookingSlots({
  productId,
  operatingHours,
  serviceDurationMinutes,
  daysToGenerate,
}: GenerateSlotsParams) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { service: true },
  });

  if (!product?.service) {
    throw new AppError("Product Service data not found", HttpStatus.NOT_FOUND);
  }

  const slotsToCreate: Prisma.BookingSlotCreateManyInput[] = [];
  const today = new Date();

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = add(today, { days: i });
    const dayOfWeek = currentDate.getDay();

    const workHours = operatingHours.find((h) => h.dayOfWeek === dayOfWeek && h.isOpen);

    if (workHours) {
      let currentTime = set(currentDate, {
        hours: workHours.openTime.getHours(),
        minutes: workHours.openTime.getMinutes(),
        seconds: 0,
        milliseconds: 0,
      });

      const closeTime = set(currentDate, {
        hours: workHours.closeTime.getHours(),
        minutes: workHours.closeTime.getMinutes(),
        seconds: 0,
        milliseconds: 0,
      });

      while (add(currentTime, { minutes: serviceDurationMinutes }) <= closeTime) {
        const slotEndTime = add(currentTime, { minutes: serviceDurationMinutes });

        slotsToCreate.push({
          productServiceId: product.service.id,
          date: currentDate,
          startTime: currentTime,
          endTime: slotEndTime,
          status: "AVAILABLE",
        });

        currentTime = slotEndTime;
      }
    }
  }

  if (slotsToCreate.length > 0) {
    await BookingRepository.createMany(slotsToCreate as any);
  }
}
