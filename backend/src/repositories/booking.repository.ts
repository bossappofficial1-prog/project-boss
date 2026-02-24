import { $Enums, BookingSlot } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateBookingSlotInput, UpdateBookingSlotInput } from "../schemas/booking.schema";

export class BookingRepository {
  static async create(
    data: Omit<CreateBookingSlotInput, "productId"> & { productServiceId: string },
  ): Promise<Pick<BookingSlot, "id" | "date" | "startTime" | "endTime" | "status">> {
    return db.bookingSlot.create({
      data: {
        productServiceId: data.productServiceId,
        date: new Date(data.date),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        status: "AVAILABLE",
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        date: true,
        status: true,
      },
    });
  }

  static async findById(id: string): Promise<BookingSlot | null> {
    return db.bookingSlot.findUnique({
      where: { id },
    });
  }

  static async findByProductServiceId(productServiceId: string): Promise<BookingSlot[]> {
    return db.bookingSlot.findMany({
      where: { productServiceId },
    });
  }

  static async getSlots(slotId: string) {
    const slot = await db.bookingSlot.findUnique({
      where: { id: slotId },
      include: {
        productService: {
          include: { product: true },
        },
      },
    });

    return slot;
  }

  static async createMany(
    data: {
      status: $Enums.BookingSlotStatus;
      date: Date;
      endTime: Date;
      productServiceId: string;
      startTime: Date;
    }[],
  ) {
    const slots = await db.bookingSlot.createMany({
      skipDuplicates: true,
      data,
    });
    return slots;
  }

  static async getSlotsByProductServiceId(productServiceId: string, date: any) {
    const slots = await db.bookingSlot.findMany({
      where: {
        AND: [{ productServiceId }, { date }],
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        date: true,
        status: true,
        orderItemId: true,
        productServiceId: true,
      },
    });

    return slots;
  }

  static async findWithProduct(slotId: string) {
    return db.bookingSlot.findUnique({
      where: { id: slotId },
      include: {
        productService: {
          select: {
            id: true,
            productId: true,
            product: {
              select: {
                id: true,
                name: true,
                outletId: true,
              },
            },
          },
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

  static async deleteByProductServiceId(productServiceId: string) {
    return db.bookingSlot.deleteMany({
      where: { productServiceId },
    });
  }
}
