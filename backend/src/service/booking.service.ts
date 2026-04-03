import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { BookingRepository } from "../repositories/booking.repository";
import { CreateBookingSlotInput, UpdateBookingSlotInput } from "../schemas/booking.schema";
import { getProductByIdService } from "./product.service";
import { db } from "../config/prisma";
import { Prisma, BookingSlot } from "@prisma/client";
import { add, set } from "date-fns";
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

  // Generate slots if there are no AVAILABLE slots (e.g., they were cleared during a service schedule update)
  const hasAvailableSlots = slots.some((s) => s.status === "AVAILABLE");
  if (!hasAvailableSlots) {
    const serviceDurationMinutes = product.service?.durationMinutes ?? 60;

    await generateSlotsForDate({
      productId,
      serviceOperatingHours: product.service,
      serviceDurationMinutes,
      date,
      existingSlots: slots,
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
  serviceOperatingHours: any; // ProductService with operating hours
  serviceDurationMinutes: number;
  date: Date;
  existingSlots?: { startTime: Date | string; endTime: Date | string }[];
};

/**
 * Logic to generate specific time slots for a single date based on service operating hours.
 */
export async function generateSlotsForDate({
  productId,
  serviceOperatingHours,
  serviceDurationMinutes,
  date,
  existingSlots,
}: GenerateSlotsForDateParams) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { service: true },
  });

  if (!product?.service) {
    throw new AppError("Product Service data not found", HttpStatus.NOT_FOUND);
  }

  const slotsToCreate: Prisma.BookingSlotCreateManyInput[] = [];
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Map dayOfWeek to corresponding field names
  const dayMap: { [key: number]: { open: string; close: string } } = {
    0: { open: "sundayOpen", close: "sundayClose" },
    1: { open: "mondayOpen", close: "mondayClose" },
    2: { open: "tuesdayOpen", close: "tuesdayClose" },
    3: { open: "wednesdayOpen", close: "wednesdayClose" },
    4: { open: "thursdayOpen", close: "thursdayClose" },
    5: { open: "fridayOpen", close: "fridayClose" },
    6: { open: "saturdayOpen", close: "saturdayClose" },
  };

  const dayFields = dayMap[dayOfWeek];
  const openTime = serviceOperatingHours[dayFields.open];
  const closeTime = serviceOperatingHours[dayFields.close];

  // Jika tidak ada jam operasional untuk hari ini (null), skip
  if (!openTime || !closeTime) return;

  const open = new Date(openTime);
  const close = new Date(closeTime);

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

    // Check if the generated slot overlaps with any existing slots (e.g., BOOKED slots)
    const isOverlapping = existingSlots?.some((s) => {
      const sStart = new Date(s.startTime);
      const sEnd = new Date(s.endTime);
      return slotStart < sEnd && slotEnd > sStart;
    });

    if (!isOverlapping) {
      slotsToCreate.push({
        productServiceId: product.service.id,
        date,
        startTime: slotStart,
        endTime: slotEnd,
        status: "AVAILABLE",
      });
    }

    slotStart = slotEnd;
  }

  if (slotsToCreate.length > 0) {
    await BookingRepository.createMany(slotsToCreate as any);
  }
}

type GenerateSlotsParams = {
  productId: string;
  serviceOperatingHours: any; // ProductService with operating hours
  serviceDurationMinutes: number;
  daysToGenerate: number;
};

/**
 * Generates default booking slots for a range of days based on service operating hours.
 */
export async function generateDefaultBookingSlots({
  productId,
  serviceOperatingHours,
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

  // Map dayOfWeek to corresponding field names
  const dayMap: { [key: number]: { open: string; close: string } } = {
    0: { open: "sundayOpen", close: "sundayClose" },
    1: { open: "mondayOpen", close: "mondayClose" },
    2: { open: "tuesdayOpen", close: "tuesdayClose" },
    3: { open: "wednesdayOpen", close: "wednesdayClose" },
    4: { open: "thursdayOpen", close: "thursdayClose" },
    5: { open: "fridayOpen", close: "fridayClose" },
    6: { open: "saturdayOpen", close: "saturdayClose" },
  };

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = add(today, { days: i });
    const dayOfWeek = currentDate.getDay();

    const dayFields = dayMap[dayOfWeek];
    const openTime = serviceOperatingHours[dayFields.open];
    const closeTime = serviceOperatingHours[dayFields.close];

    if (openTime && closeTime) {
      let currentTime = set(currentDate, {
        hours: new Date(openTime).getHours(),
        minutes: new Date(openTime).getMinutes(),
        seconds: 0,
        milliseconds: 0,
      });

      const closeTimeSet = set(currentDate, {
        hours: new Date(closeTime).getHours(),
        minutes: new Date(closeTime).getMinutes(),
        seconds: 0,
        milliseconds: 0,
      });

      while (add(currentTime, { minutes: serviceDurationMinutes }) <= closeTimeSet) {
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
