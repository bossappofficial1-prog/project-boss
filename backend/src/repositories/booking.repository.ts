import { $Enums, BookingSlot, BookingSlotStatus } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateBookingSlotInput, UpdateBookingSlotInput } from "../schemas/booking.schema";

export interface RawBookingSlot {
  id: string
  date: Date
  startTime: Date
  endTime: Date
  status: BookingSlotStatus
  productServiceId: string
  serviceName: string
  providerName: string
  durationMinutes: number
  orderItem: {
    orderId: string
    guestCustomerName: string
    guestCustomerPhone: string
  } | null
}

export interface RawServiceOption {
  id: string
  serviceName: string
  providerName: string
  durationMinutes: number
}

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

  static async getServiceOptions(outletId: string): Promise<RawServiceOption[]> {
    const services = await db.productService.findMany({
      where: { product: { outletId, status: "ACTIVE" } },
      select: {
        id: true,
        providerName: true,
        durationMinutes: true,
        product: { select: { name: true } },
      },
      orderBy: { providerName: "asc" },
    })

    return services.map((s) => ({
      id: s.id,
      serviceName: s.product.name,
      providerName: s.providerName,
      durationMinutes: s.durationMinutes,
    }))
  }

  static async getOperatingHours(outletId: string) {
    return db.outletOperatingHours.findMany({
      where: { outletId },
      orderBy: { dayOfWeek: "asc" },
    })
  }

  static async getSlotsCalendar(
    outletId: string,
    startDate: Date,
    endDate: Date,
    productServiceId?: string,
    providerName?: string
  ): Promise<RawBookingSlot[]> {
    const slots = await db.bookingSlot.findMany({
      where: {
        status: { notIn: ["AVAILABLE"] }
        // date: { gte: startDate, lte: endDate },
        // productService: {
        //   product: { outletId },
        //   ...(productServiceId ? { id: productServiceId } : {}),
        //   ...(providerName ? { providerName } : {}),
        // },
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        productServiceId: true,
        productService: {
          select: {
            durationMinutes: true,
            providerName: true,
            product: { select: { name: true } },
          },
        },
        order: {
          select: {
            orderId: true,
            order: {
              select: {
                id: true,
                guestCustomer: {
                  select: { name: true, phone: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    })

    return slots.map((slot) => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      productServiceId: slot.productServiceId,
      serviceName: slot.productService.product.name,
      providerName: slot.productService.providerName,
      durationMinutes: slot.productService.durationMinutes,
      orderItem: slot.order
        ? {
          orderId: slot.order.order.id,
          guestCustomerName: slot.order.order.guestCustomer.name,
          guestCustomerPhone: slot.order.order.guestCustomer.phone,
        }
        : null,
    }))
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
      orderBy: {
        startTime: "asc",
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
