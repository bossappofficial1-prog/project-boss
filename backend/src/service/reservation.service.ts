import { BaseService } from "./base.service";
import { PlanLimitService } from "./plan-limit.service";
import { db } from "../config/prisma";
import { ReservationRepository } from "../repositories/reservation.repository";
import { CreateReservationInput, GetReservationsQuery } from "../schemas/reservation.schema";
import { OrderStatus, TableStatus } from "@prisma/client";
import { addMinutes, startOfDay, endOfDay, getDay } from "date-fns";

const VALID_TRANSITIONS: Record<string, string[]> = {
  RESERVED: ["ON_GOING", "CANCELLED"],
  ON_GOING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const MIN_ADVANCE_MINUTES = 30;

export class ReservationService extends BaseService {
  static async createReservation(data: CreateReservationInput, staffId?: string) {
    const bookingStart = new Date(data.bookingDate);
    const bookingEnd = addMinutes(bookingStart, data.durationMinutes);
    const now = new Date();

    const outlet = await db.outlet.findUnique({
      where: { id: data.outletId },
      select: { businessId: true }
    });
    if (!outlet) {
      this.notFound("Outlet tidak ditemukan");
    }
    await PlanLimitService.assertSubscriptionActive(outlet.businessId);

    if (bookingStart < now) {
      this.badRequest("Tidak dapat melakukan reservasi untuk waktu di masa lalu");
    }

    const minAdvance = addMinutes(now, MIN_ADVANCE_MINUTES);
    if (bookingStart < minAdvance) {
      this.badRequest(`Reservasi harus dibuat minimal ${MIN_ADVANCE_MINUTES} menit sebelum waktu booking`);
    }

    const table = await ReservationRepository.findTableById(data.tableId);
    if (!table) {
      this.notFound("Meja tidak ditemukan");
    }

    if (data.guestCount > table.capacity) {
      this.badRequest(`Meja ${table.name} hanya muat ${table.capacity} orang`);
    }

    const outletHours = await ReservationRepository.findOutletHours(data.outletId);
    const dayOfWeek = getDay(bookingStart);
    const dayHours = outletHours.find((h: any) => h.dayOfWeek === dayOfWeek);

    if (!dayHours || !dayHours.isOpen) {
      this.badRequest("Outlet tutup pada hari yang dipilih");
    }

    const openTime = new Date(dayHours.openTime);
    const closeTime = new Date(dayHours.closeTime);
    const bookingTime = new Date(bookingStart);

    const bookingTimeMinutes = bookingTime.getHours() * 60 + bookingTime.getMinutes();
    const openTimeMinutes = openTime.getHours() * 60 + openTime.getMinutes();
    const closeTimeMinutes = closeTime.getHours() * 60 + closeTime.getMinutes();

    if (bookingTimeMinutes < openTimeMinutes || bookingTimeMinutes + data.durationMinutes > closeTimeMinutes) {
      this.badRequest("Jam reservasi di luar jam operasional outlet");
    }

    try {
      const reservation = await ReservationRepository.createReservationTransaction(
        data.tableId,
        bookingStart,
        bookingEnd,
        data.guestCount,
        {
          name: data.customerName,
          phone: data.customerPhone,
        },
        {
          totalAmount: 0,
          bookingDate: bookingStart,
          bookingDurationMinutes: data.durationMinutes,
          guestCount: data.guestCount,
          orderStatus: "RESERVED",
          customerType: "GUEST",
          outletId: data.outletId,
          tableId: data.tableId,
          handledByStaffId: staffId,
          notes: data.notes,
        }
      );

      await ReservationRepository.updateTableStatus(data.tableId, "RESERVED");

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

    const currentStatus = order.orderStatus;
    const allowedNext = VALID_TRANSITIONS[currentStatus];

    if (!allowedNext || !allowedNext.includes(status)) {
      this.badRequest(`Tidak dapat mengubah status dari ${currentStatus} ke ${status}`);
    }

    const updated = await ReservationRepository.updateStatus(id, status);

    if (updated.tableId) {
      if (status === "ON_GOING") {
        await ReservationRepository.updateTableStatus(updated.tableId, "OCCUPIED");
      } else if (status === "COMPLETED" || status === "CANCELLED") {
        const hasOtherReservations = await ReservationRepository.hasActiveReservations(updated.tableId, id);
        if (!hasOtherReservations) {
          await ReservationRepository.updateTableStatus(updated.tableId, "AVAILABLE");
        }
      }
    }

    return updated;
  }
}
