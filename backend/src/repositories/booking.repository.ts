import { $Enums, BookingSlot } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateBookingSlotInput, UpdateBookingSlotInput } from "../schemas/booking.schema";

export class BookingRepository {
    static async create(data: CreateBookingSlotInput): Promise<Pick<BookingSlot, "id" | "date" | "startTime" | "endTime" | "status" | "staffId">> {
        return db.bookingSlot.create({
            data: {
                ...data,
                date: new Date(data.date),
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
            },
            select: {
                id: true,
                startTime: true,
                endTime: true,
                date: true,
                status: true,
                staffId: true,
            }
        });
    }

    static async findById(id: string): Promise<BookingSlot | null> {
        return db.bookingSlot.findUnique({
            where: { id },
        });
    }

    static async findByProductId(productId: string): Promise<BookingSlot[]> {
        return db.bookingSlot.findMany({
            where: { productId },
        });
    }

    static async getSlots(slotId: string) {
        const slot = await db.bookingSlot.findUnique({
            where: { id: slotId },
            include: { product: true }
        })

        return slot
    }

    static async createMany(data: {
        status: $Enums.BookingSlotStatus,
        date: Date,
        endTime: Date,
        productId: string,
        startTime: Date
    }[]) {
        const slots = await db.bookingSlot.createMany({
            skipDuplicates: true,
            data
        })
        return slots
    }

    static async getSlotsByProductId(productId: string, date: any) {
        const slots = await db.bookingSlot.findMany({
            where: {
                AND: [
                    { productId },
                    { date },
                    { orderId: null }
                ]
            },
            select: {
                id: true,
                startTime: true,
                endTime: true,
                date: true,
                status: true,
                staffId: true,
                staff: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        role: true,
                    }
                }
            }
        })

        return slots
    }

    static async findWithProduct(slotId: string) {
        return db.bookingSlot.findUnique({
            where: { id: slotId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        outletId: true,
                    }
                },
            },
        });
    }

    static async update(id: string, data: UpdateBookingSlotInput): Promise<BookingSlot> {
        return db.bookingSlot.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string): Promise<BookingSlot> {
        return db.bookingSlot.delete({
            where: { id },
        });
    }

    static async deleteByProductId(productId: string) {
        return db.bookingSlot.deleteMany({
            where: { productId }
        })
    }
}