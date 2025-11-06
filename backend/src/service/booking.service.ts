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
import { Prisma, PrismaClient, OutletOperatingHours, BookingSlot } from "@prisma/client";
import { add, set } from "date-fns";
import { getOutletByIdService } from "./outlet.service";
import { generateTimeSlots } from "../utils";
import Console from "../utils/logger";

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

export async function getBookingSlotByProductService(productId: string, date: Date): Promise<Array<Pick<BookingSlot, "id" | "date" | "startTime" | "endTime">>> {
    let slots = await BookingRepository.getSlotsByProductId(productId, date);
    Console.log(slots)

    if (!slots.length) {
        const product = await getProductByIdService(productId);

        if (product.type !== 'SERVICE') {
            throw new AppError("Slots can only be generated for SERVICE type products.", HttpStatus.BAD_REQUEST);
        }

        const serviceDurationMinutes = product.serviceDurationMinutes ?? 60

        const outletId = product.outletId
        if (!outletId) {
            throw new AppError("Product tidak memiliki outlet terkait (outletId).", HttpStatus.BAD_REQUEST);
        }

        const outlet = await getOutletByIdService(outletId)

        await generateSlotsForDate({
            productId,
            operatingHours: outlet.operatingHours,
            serviceDurationMinutes,
            date,
        });

        slots = await BookingRepository.getSlotsByProductId(productId, date);
    }

    return slots
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