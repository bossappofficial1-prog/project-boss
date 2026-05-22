import { db } from "../config/prisma";
import { Prisma, TableStatus } from "@prisma/client";

export class ReservationRepository {
  static async findTableById(tableId: string) {
    return db.outletTable.findUnique({
      where: { id: tableId },
    });
  }

  static async findOutletHours(outletId: string) {
    return db.outletOperatingHours.findMany({
      where: { outletId },
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

  static async createReservationTransaction(
    tableId: string,
    bookingStart: Date,
    bookingEnd: Date,
    guestCount: number,
    customerData: { name: string; phone: string },
    reservationData: Omit<Prisma.OrderUncheckedCreateInput, "guestCustomerId">,
  ) {
    return db.$transaction(async (tx) => {
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

      let customer = await tx.guestCustomer.findUnique({
        where: { phone: customerData.phone },
      });

      if (!customer) {
        customer = await tx.guestCustomer.create({
          data: customerData,
        });
      }

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

  static async updateTableStatus(tableId: string, status: TableStatus) {
    return db.outletTable.update({
      where: { id: tableId },
      data: { status },
    });
  }

  static async hasActiveReservations(tableId: string, excludeOrderId: string) {
    const count = await db.order.count({
      where: {
        tableId,
        id: { not: excludeOrderId },
        orderStatus: { in: ["RESERVED", "ON_GOING"] },
        bookingDate: { not: null },
      },
    });
    return count > 0;
  }
}
