import { BaseService } from "./base.service";
import { ReservationRepository } from "../repositories/reservation.repository";
import { CreateReservationInput, GetReservationsQuery } from "../schemas/reservation.schema";
import { OrderStatus } from "@prisma/client";
import { addMinutes, startOfDay, endOfDay } from "date-fns";

export class ReservationService extends BaseService {
  static async createReservation(data: CreateReservationInput, staffId?: string) {
    const bookingStart = new Date(data.bookingDate);
    const bookingEnd = addMinutes(bookingStart, data.durationMinutes);

    // Prevent booking in the past
    if (bookingStart < new Date()) {
      this.badRequest("Tidak dapat melakukan reservasi untuk waktu di masa lalu");
    }

    try {
      const reservation = await ReservationRepository.createReservationTransaction(
        data.tableId,
        bookingStart,
        bookingEnd,
        {
          name: data.customerName,
          phone: data.customerPhone,
        },
        {
          totalAmount: 0,
          bookingDate: bookingStart,
          bookingDurationMinutes: data.durationMinutes,
          orderStatus: "RESERVED",
          customerType: "GUEST",
          outletId: data.outletId,
          tableId: data.tableId,
          handledByStaffId: staffId,
          notes: data.notes,
        }
      );

      return reservation;
    } catch (error: any) {
      if (error.message === "CONFLICT") {
        this.conflict("Meja tidak tersedia pada jadwal tersebut");
      }
      throw error;
    }
  }

  static async getReservations(query: GetReservationsQuery) {
    const where: any = {
      outletId: query.outletId,
      bookingDate: {
        not: null,
      },
    };

    if (query.status) {
      where.orderStatus = query.status;
    }

    if (query.date) {
      const dateStart = startOfDay(new Date(query.date));
      const dateEnd = endOfDay(new Date(query.date));
      where.bookingDate = {
        gte: dateStart,
        lte: dateEnd,
      };
    }

    return ReservationRepository.findAll(where);
  }

  static async updateReservationStatus(id: string, status: OrderStatus, outletId: string) {
    const order = await ReservationRepository.findById(id);
    if (!order) this.notFound("Reservasi tidak ditemukan");
    if (order.outletId !== outletId) this.forbidden("Akses ditolak ke outlet ini");

    const updated = await ReservationRepository.updateStatus(id, status);

    if (updated.tableId) {
      if (status === "ON_GOING") {
        await ReservationRepository.updateTableStatus(updated.tableId, "OCCUPIED");
      } else if (status === "COMPLETED" || status === "CANCELLED") {
        await ReservationRepository.updateTableStatus(updated.tableId, "AVAILABLE");
      }
    }

    return updated;
  }
}
