import { BaseService } from "./base.service";
import { AttendanceRepository } from "../repositories/attendance.repository";
import { StaffRepository } from "../repositories/staff.repository";
import { OutletRepository } from "../repositories/outlet.repository";

const MAX_DISTANCE_METERS = 100;

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class AttendanceService extends BaseService {
  static async clockIn(params: {
    staffId: string;
    outletId: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) {
    const { staffId, outletId, latitude, longitude, notes } = params;

    const staff = await StaffRepository.findById(staffId);
    if (!staff) this.notFound("Staff tidak ditemukan.");
    if (staff.outletId !== outletId) {
      this.forbidden("Staff tidak terdaftar pada outlet ini.");
    }
    if (staff.status !== "ACTIVE") {
      this.forbidden("Staff tidak aktif.");
    }

    const today = new Date();
    const existing = await AttendanceRepository.findByStaffAndDate(staffId, today);
    if (existing) {
      if (existing.clockOut) {
        this.conflict("Sudah absen hari ini.");
      } else {
        this.conflict("Belum clock-out dari absen hari ini.");
      }
    }

    if (latitude !== undefined && longitude !== undefined) {
      const outlet = await AttendanceRepository.findOutletById(outletId);
      if (!outlet) this.notFound("Outlet tidak ditemukan.");
      if (outlet.latitude != null && outlet.longitude != null) {
        const distance = haversineDistance(
          latitude, longitude,
          outlet.latitude, outlet.longitude,
        );
        if (distance > MAX_DISTANCE_METERS) {
          this.badRequest(
            `Anda berada di luar area outlet (${Math.round(distance)}m dari outlet, maksimal ${MAX_DISTANCE_METERS}m).`,
          );
        }
      }
    }

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    return AttendanceRepository.create({
      staffId,
      outletId,
      date: startOfDay,
      clockIn: today,
      notes,
      clockInLat: latitude ?? null,
      clockInLng: longitude ?? null,
    });
  }

  static async clockOut(params: {
    staffId: string;
    attendanceId: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) {
    const { staffId, attendanceId, latitude, longitude, notes } = params;

    const attendance = await AttendanceRepository.findByStaffAndDate(staffId, new Date());
    if (!attendance) {
      this.notFound("Belum absen masuk hari ini.");
    }
    if (attendance.clockOut) {
      this.conflict("Sudah clock-out.");
    }
    if (attendance.id !== attendanceId) {
      this.forbidden("Data absensi tidak sesuai.");
    }

    if (latitude !== undefined && longitude !== undefined) {
      const outlet = await AttendanceRepository.findOutletById(attendance.outletId);
      if (outlet && outlet.latitude != null && outlet.longitude != null) {
        const distance = haversineDistance(
          latitude, longitude,
          outlet.latitude, outlet.longitude,
        );
        if (distance > MAX_DISTANCE_METERS) {
          this.badRequest(
            `Anda berada di luar area outlet (${Math.round(distance)}m dari outlet, maksimal ${MAX_DISTANCE_METERS}m).`,
          );
        }
      }
    }

    return AttendanceRepository.clockOut(attendanceId, {
      clockOut: new Date(),
      notes,
      clockOutLat: latitude ?? null,
      clockOutLng: longitude ?? null,
    });
  }

  static async getMyAttendance(staffId: string, page: number, limit: number) {
    return AttendanceRepository.findMe(staffId, page, limit);
  }

  static async getToday(staffId: string) {
    return AttendanceRepository.findByStaffAndDate(staffId, new Date());
  }

  static async listForOwner(params: {
    businessId: string;
    outletId?: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }) {
    const { outletId, businessId, staffId, startDate, endDate, page, limit } = params;
    if (!outletId) {
      this.badRequest("Parameter outletId wajib diisi.");
    }

    const outlet = await OutletRepository.findById(outletId);
    if (!outlet) this.notFound("Outlet tidak ditemukan.");
    if (outlet.businessId !== businessId) this.forbidden("Unauthorized.");

    const startOfRange = startDate
      ? new Date(`${startDate}T00:00:00`)
      : undefined;
    const endOfRange = endDate
      ? (() => { const d = new Date(`${endDate}T23:59:59`); return d; })()
      : undefined;

    return AttendanceRepository.findAll({
      outletId,
      staffId,
      startDate: startOfRange,
      endDate: endOfRange,
      page,
      limit,
    });
  }
}
