import { db } from "../config/prisma";
import { Prisma } from "@prisma/client";

export class ReservationRepository {
  static async findConflictingReservations(tableId: string) {
    return db.order.findMany({
      where: {
        tableId,
        orderStatus: {
          in: ["RESERVED", "ON_GOING", "PROCESSING", "CONFIRMED"],
        },
        bookingDate: {
          not: null,
        },
        bookingDurationMinutes: {
          not: null,
        },
      },
      select: {
        bookingDate: true,
        bookingDurationMinutes: true,
      },
    });
  }

  static async findCustomerByPhone(phone: string) {
    return db.guestCustomer.findUnique({
      where: { phone },
    });
  }

  static async createCustomer(data: { name: string; phone: string }) {
    return db.guestCustomer.create({
      data,
    });
  }

  static async createReservation(data: Prisma.OrderUncheckedCreateInput) {
    return db.order.create({
      data,
      include: {
        guestCustomer: true,
        table: true,
      },
    });
  }

  static async createReservationTransaction(
    tableId: string,
    bookingStart: Date,
    bookingEnd: Date,
    customerData: { name: string; phone: string },
    reservationData: Omit<Prisma.OrderUncheckedCreateInput, "guestCustomerId">,
  ) {
    return db.$transaction(async (tx) => {
      // 1. Check for conflicts
      const conflictingReservations = await tx.order.findMany({
        where: {
          tableId,
          orderStatus: {
            in: ["RESERVED", "ON_GOING", "PROCESSING", "CONFIRMED"],
          },
          bookingDate: { not: null },
          bookingDurationMinutes: { not: null },
        },
        select: {
          bookingDate: true,
          bookingDurationMinutes: true,
        },
      });

      const isConflict = conflictingReservations.some((res: any) => {
        if (!res.bookingDate || !res.bookingDurationMinutes) return false;
        const resStart = new Date(res.bookingDate);
        const resEnd = new Date(resStart.getTime() + res.bookingDurationMinutes * 60000);
        return resStart < bookingEnd && resEnd > bookingStart;
      });

      if (isConflict) {
        throw new Error("CONFLICT");
      }

      // 2. Find or create customer
      let customer = await tx.guestCustomer.findUnique({
        where: { phone: customerData.phone },
      });

      if (!customer) {
        customer = await tx.guestCustomer.create({
          data: customerData,
        });
      }

      // 3. Create order
      return tx.order.create({
        data: {
          ...reservationData,
          guestCustomerId: customer.id,
        },
        include: {
          guestCustomer: true,
          table: true,
        },
      });
    });
  }

  static async findAll(where: any) {
    return db.order.findMany({
      where,
      include: {
        guestCustomer: true,
        table: true,
      },
      orderBy: {
        bookingDate: "asc",
      },
    });
  }

  static async findById(id: string) {
    return db.order.findUnique({
      where: { id },
    });
  }

  static async updateStatus(id: string, status: any) {
    return db.order.update({
      where: { id },
      data: { orderStatus: status },
      include: {
        guestCustomer: true,
        table: true,
      },
    });
  }

  static async updateTableStatus(tableId: string, status: any) {
    return db.outletTable.update({
      where: { id: tableId },
      data: { status },
    });
  }
}
