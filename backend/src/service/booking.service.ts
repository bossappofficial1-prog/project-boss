import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { BookingRepository } from "../repositories/booking.repository";
import { CreateBookingSlotInput, UpdateBookingSlotInput } from "../schemas/booking.schema";
import { getProductByIdService } from "./product.service";
import { createMidtransTransactionService } from './payment.service';
import { getOrderByIdService } from './order.service';
import { db } from '../config/prisma';
import { config } from '../config';
import { Prisma, PrismaClient, OutletOperatingHours, BookingSlot, StaffRole, StaffStatus } from "@prisma/client";
import { add, set } from "date-fns";
import { getOutletByIdService } from "./outlet.service";
import { generateTimeSlots } from "../utils";
import Console from "../utils/logger";
import { getStaffAvailabilityForWindow, StaffAvailabilityResult } from "./staff.service";

export async function createBookingSlotService(data: CreateBookingSlotInput) {
    const product = await getProductByIdService(data.productId);
    if (product.type !== 'SERVICE') {
        throw new AppError("Booking slots can only be created for SERVICE type products.", HttpStatus.BAD_REQUEST);
    }
    const bookingSlot = await BookingRepository.create(data);
    return bookingSlot;
}

export async function createBookingAndMidtransTransactionService(data: CreateBookingSlotInput, orderId: string) {
    const bookingSlot = await createBookingSlotService(data);

    // Get order details untuk menghitung fees
    const order = await getOrderByIdService(orderId);

    // Hitung fees sesuai struktur baru
    const midtransFee = Math.round(order.totalAmount * 0.007); // 0.7%
    const appFee = Math.round(order.totalAmount * 0.02); // 2%

    // Tentukan payment method - untuk booking biasanya QRIS
    const paymentMethod: 'online' | 'qris' = 'qris';

    // Gunakan chargedTo dari order yang sudah ada
    const chargedTo = order.chargedTo.toLowerCase() as 'customer' | 'owner';

    // Total amount yang akan ditagih ke customer (termasuk fees jika ditanggung customer)
    let finalAmount = order.totalAmount;
    if (chargedTo === 'customer') {
        finalAmount += midtransFee + appFee;
    }

    const midtransTransaction = await createMidtransTransactionService(
        orderId,
        finalAmount,
        midtransFee,
        appFee,
        paymentMethod,
        chargedTo
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

export async function getBookingSlotsByProductIdService(productId: string) {
    const bookingSlots = await BookingRepository.findByProductId(productId);
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

type BookingSlotWithStaff = Pick<BookingSlot, "id" | "date" | "startTime" | "endTime" | "status" | "staffId"> & {
    staff: null | {
        id: string;
        name: string;
        status: StaffStatus;
        role: StaffRole;
    };
    availableStaffCount: number;
    totalStaffCount: number;
};

export async function getBookingSlotByProductService(productId: string, date: Date): Promise<BookingSlotWithStaff[]> {
    const product = await getProductByIdService(productId);

    if (product.type !== 'SERVICE') {
        throw new AppError("Slots can only be generated for SERVICE type products.", HttpStatus.BAD_REQUEST);
    }

    const outletId = product.outletId;
    if (!outletId) {
        throw new AppError("Product tidak memiliki outlet terkait (outletId).", HttpStatus.BAD_REQUEST);
    }

    let slots = await BookingRepository.getSlotsByProductId(productId, date);

    if (!slots.length) {
        const serviceDurationMinutes = product.serviceDurationMinutes ?? 60;
        const outlet = await getOutletByIdService(outletId);

        await generateSlotsForDate({
            productId,
            operatingHours: outlet.operatingHours,
            serviceDurationMinutes,
            date,
        });

        slots = await BookingRepository.getSlotsByProductId(productId, date);
    }

    if (!slots.length) {
        return [];
    }

    const availabilityDetails = await Promise.all(slots.map(async (slot) => {
        if (slot.status === 'BLOCKED') {
            return {
                availableStaffCount: 0,
                totalStaffCount: 0,
            };
        }

        const staffAvailability = await getAvailableStaffForProductSlotService({
            productId,
            outletId,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
        });

        const availableStaffCount = staffAvailability.filter((member) => member.isAvailable).length;

        return {
            availableStaffCount: Math.min(availableStaffCount),
            totalStaffCount: Math.min(staffAvailability.length),
        };
    }));

    return slots.map((slot, index) => {
        const availability = availabilityDetails[index];
        const derivedStatus = slot.status === 'BLOCKED'
            ? slot.status
            : (availability.availableStaffCount > 0 ? 'AVAILABLE' : 'BOOKED');

        return {
            ...slot,
            status: derivedStatus as BookingSlot['status'],
            availableStaffCount: availability.availableStaffCount,
            totalStaffCount: availability.totalStaffCount,
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
    const { outletId, startTime, endTime, excludeSlotId, productId: _productId } = params;

    if (endTime <= startTime) {
        throw new AppError("Waktu selesai harus lebih besar dari waktu mulai", HttpStatus.BAD_REQUEST);
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

export async function generateSlotsForDate({ productId, operatingHours, serviceDurationMinutes, date }: GenerateSlotsForDateParams) {
    const slotsToCreate: Prisma.BookingSlotCreateManyInput[] = [];
    const dayOfWeek = date.getDay(); // 0-6

    const workHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isOpen);
    if (!workHours) return;

    // build start and close times on the requested date
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

    // if close <= open, treat close as next day
    if (slotClose <= slotStart) {
        slotClose = add(slotClose, { days: 1 });
    }

    // create slots [start, start + duration) while fully inside operating window
    while (add(slotStart, { minutes: serviceDurationMinutes }) <= slotClose) {
        const slotEnd = add(slotStart, { minutes: serviceDurationMinutes });

        slotsToCreate.push({
            productId,
            date,
            startTime: slotStart,
            endTime: slotEnd,
            status: 'AVAILABLE',
        });
        console.log(productId);

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
 * Generates default booking slots for a service product based on outlet operating hours.
 * @param prisma - Prisma client instance.
 * @param params - Parameters for slot generation.
 */
export async function generateDefaultBookingSlots(
    { productId, operatingHours, serviceDurationMinutes, daysToGenerate }: GenerateSlotsParams
) {
    const slotsToCreate: Prisma.BookingSlotCreateManyInput[] = [];
    const today = new Date();

    for (let i = 0; i < daysToGenerate; i++) {
        const currentDate = add(today, { days: i });
        const dayOfWeek = currentDate.getDay();

        const workHours = operatingHours.find(h => h.dayOfWeek === dayOfWeek && h.isOpen);

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
                    productId: productId,
                    date: currentDate,
                    startTime: currentTime,
                    endTime: slotEndTime,
                    status: 'AVAILABLE',
                });

                currentTime = slotEndTime;
            }
        }
    }

    if (slotsToCreate.length > 0) {
        await BookingRepository.createMany(slotsToCreate as any)
    }
}