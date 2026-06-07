import { BaseService } from "./base.service";
import { AttendanceRepository } from "../repositories/attendance.repository";
import { StaffRepository } from "../repositories/staff.repository";
import { OutletRepository } from "../repositories/outlet.repository";
import { ImageService } from "./image.service";
import { db } from "../config/prisma";
import { BcryptUtil } from "../utils";

const MAX_DISTANCE_METERS = 100;

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
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

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatTime(date: Date): string {
  return date.toTimeString().split(" ")[0].substring(0, 5);
}

export class AttendanceService extends BaseService {
  static async clockIn(params: {
    staffId: string;
    outletId: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    clockInFaceUrl?: string;
  }) {
    const { staffId, outletId, latitude, longitude, notes, clockInFaceUrl } =
      params;

    const staff = await StaffRepository.findById(staffId);
    if (!staff) this.notFound("Staff tidak ditemukan.");
    if (staff.outletId !== outletId) {
      this.forbidden("Staff tidak terdaftar pada outlet ini.");
    }
    if (staff.status !== "ACTIVE") {
      this.forbidden("Staff tidak aktif.");
    }

    const today = new Date();
    const existing = await AttendanceRepository.findByStaffAndDate(
      staffId,
      today,
    );
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
          latitude,
          longitude,
          outlet.latitude,
          outlet.longitude,
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

    const result = await AttendanceRepository.create({
      staffId,
      outletId,
      date: startOfDay,
      clockIn: today,
      notes,
      clockInLat: latitude ?? null,
      clockInLng: longitude ?? null,
      clockInFaceUrl: clockInFaceUrl ?? null,
    });

    if (clockInFaceUrl) {
      ImageService.deleteImageByUrl(clockInFaceUrl);
    }

    return result;
  }

  static async clockOut(params: {
    staffId: string;
    attendanceId: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    clockOutFaceUrl?: string;
  }) {
    const {
      staffId,
      attendanceId,
      latitude,
      longitude,
      notes,
      clockOutFaceUrl,
    } = params;

    const attendance = await AttendanceRepository.findByStaffAndDate(
      staffId,
      new Date(),
    );
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
      const outlet = await AttendanceRepository.findOutletById(
        attendance.outletId,
      );
      if (outlet && outlet.latitude != null && outlet.longitude != null) {
        const distance = haversineDistance(
          latitude,
          longitude,
          outlet.latitude,
          outlet.longitude,
        );
        if (distance > MAX_DISTANCE_METERS) {
          this.badRequest(
            `Anda berada di luar area outlet (${Math.round(distance)}m dari outlet, maksimal ${MAX_DISTANCE_METERS}m).`,
          );
        }
      }
    }

    const result = await AttendanceRepository.clockOut(attendanceId, {
      clockOut: new Date(),
      notes,
      clockOutLat: latitude ?? null,
      clockOutLng: longitude ?? null,
      clockOutFaceUrl: clockOutFaceUrl ?? null,
    });

    if (clockOutFaceUrl) {
      ImageService.deleteImageByUrl(clockOutFaceUrl);
    }

    return result;
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
    const { outletId, businessId, staffId, startDate, endDate, page, limit } =
      params;
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
      ? (() => {
          const d = new Date(`${endDate}T23:59:59`);
          return d;
        })()
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

  static async exportAttendance(params: {
    outletId: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
    businessId: string;
  }) {
    const { outletId, businessId, staffId, startDate, endDate } = params;

    const outlet = await OutletRepository.findById(outletId);
    if (!outlet) this.notFound("Outlet tidak ditemukan.");
    if (outlet.businessId !== businessId) this.forbidden("Unauthorized.");

    const startOfRange = startDate
      ? new Date(`${startDate}T00:00:00`)
      : undefined;
    const endOfRange = endDate
      ? (() => {
          const d = new Date(`${endDate}T23:59:59`);
          return d;
        })()
      : undefined;

    const records = await AttendanceRepository.findAllForExport({
      outletId,
      staffId,
      startDate: startOfRange,
      endDate: endOfRange,
    });

    // Generate CSV content
    const headers = [
      "Tanggal",
      "Staff",
      "Username",
      "Jam Masuk",
      "Jam Pulang",
      "Durasi (jam)",
      "GPS Masuk (Lat:Lng)",
      "GPS Pulang (Lat:Lng)",
      "Catatan",
      "Dibuat Pada",
    ];

    const rows = records.map((record) => {
      const clockInTime = record.clockIn ? new Date(record.clockIn) : null;
      const clockOutTime = record.clockOut ? new Date(record.clockOut) : null;

      let duration = "";
      if (clockInTime && clockOutTime) {
        const diffMs = clockOutTime.getTime() - clockInTime.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        duration = `${hours}h ${minutes}m`;
      }

      return [
        formatDate(new Date(record.date)),
        record.staff?.name || "-",
        record.staff?.username || "-",
        clockInTime ? formatTime(clockInTime) : "-",
        clockOutTime ? formatTime(clockOutTime) : "-",
        duration,
        record.clockInLat && record.clockInLng
          ? `${record.clockInLat}, ${record.clockInLng}`
          : "-",
        record.clockOutLat && record.clockOutLng
          ? `${record.clockOutLat}, ${record.clockOutLng}`
          : "-",
        record.notes || "-",
        formatDate(new Date(record.createdAt)),
      ];
    });

    // Escape CSV values
    const escapeCsv = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCsv).join("|")),
    ].join("\n");

    return csvContent;
  }

  static async createManual(params: {
    businessId: string;
    outletId: string;
    staffId: string;
    date: string;
    clockIn: string;
    clockOut?: string;
    notes?: string;
  }) {
    const { businessId, outletId, staffId, date, clockIn, clockOut, notes } =
      params;

    const staff = await StaffRepository.findById(staffId);
    if (!staff) this.notFound("Staff tidak ditemukan.");
    if (staff.outletId !== outletId) {
      this.forbidden("Staff tidak terdaftar pada outlet ini.");
    }

    const outlet = await OutletRepository.findById(outletId);
    if (!outlet || outlet.businessId !== businessId) {
      this.notFound("Outlet tidak ditemukan atau tidak sesuai.");
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existing = await AttendanceRepository.findByStaffAndDate(
      staffId,
      attendanceDate,
    );
    if (existing) {
      this.conflict(
        "Staff sudah memiliki catatan absensi pada tanggal tersebut.",
      );
    }

    return AttendanceRepository.create({
      staffId,
      outletId,
      date: attendanceDate,
      clockIn: new Date(clockIn),
      clockOut: clockOut ? new Date(clockOut) : null,
      clockInLat: null,
      clockInLng: null,
      clockInFaceUrl: null,
      notes: notes || "Ditambahkan manual oleh Manager/Owner",
    });
  }

  static async updateManual(params: {
    id: string;
    businessId: string;
    clockIn?: string;
    clockOut?: string;
    notes?: string;
  }) {
    const { id, businessId, clockIn, clockOut, notes } = params;

    const attendance = await db.attendance.findUnique({
      where: { id },
      include: { outlet: true },
    });

    if (!attendance) {
      this.notFound("Catatan absensi tidak ditemukan.");
    }

    if (attendance.outlet.businessId !== businessId) {
      this.forbidden("Akses ditolak.");
    }

    const updateData: any = {};
    if (clockIn) updateData.clockIn = new Date(clockIn);
    if (clockOut) {
      updateData.clockOut = new Date(clockOut);
    } else if (clockOut === null) {
      updateData.clockOut = null;
    }
    if (notes !== undefined) updateData.notes = notes;

    return db.attendance.update({
      where: { id },
      data: updateData,
    });
  }

  static async deleteManual(id: string, businessId: string) {
    const attendance = await db.attendance.findUnique({
      where: { id },
      include: { outlet: true },
    });

    if (!attendance) {
      this.notFound("Catatan absensi tidak ditemukan.");
    }

    if (attendance.outlet.businessId !== businessId) {
      this.forbidden("Akses ditolak.");
    }

    return db.attendance.delete({
      where: { id },
    });
  }

  static async portalClock(params: {
    staffId: string;
    pin: string;
    outletId: string;
    type: "in" | "out";
    latitude?: number;
    longitude?: number;
    notes?: string;
    faceImageUrl?: string;
    registerFaceDescriptor?: string;
  }) {
    const {
      staffId,
      pin,
      outletId,
      type,
      latitude,
      longitude,
      notes,
      faceImageUrl,
      registerFaceDescriptor,
    } = params;

    const staff = await StaffRepository.findById(staffId);
    if (!staff) this.notFound("Staff tidak ditemukan.");
    if (staff.outletId !== outletId) {
      this.forbidden("Staff tidak terdaftar pada outlet ini.");
    }
    if (staff.status !== "ACTIVE") {
      this.forbidden("Staff tidak aktif.");
    }

    if (!staff.pin) {
      this.forbidden(
        "Staff belum memiliki PIN. Silakan hubungi manager untuk mendaftarkan PIN.",
      );
    }
    const isPinValid = await BcryptUtil.compare(pin, staff.pin);
    if (!isPinValid) {
      this.forbidden("PIN yang Anda masukkan salah.");
    }

    if (type === "in") {
      if (latitude !== undefined && longitude !== undefined) {
        const outlet = await AttendanceRepository.findOutletById(outletId);
        if (!outlet) this.notFound("Outlet tidak ditemukan.");
        if (outlet.latitude != null && outlet.longitude != null) {
          const distance = haversineDistance(
            latitude,
            longitude,
            outlet.latitude,
            outlet.longitude,
          );
          if (distance > MAX_DISTANCE_METERS) {
            this.badRequest(
              `Anda berada di luar area outlet (${Math.round(distance)}m dari outlet, maksimal ${MAX_DISTANCE_METERS}m).`,
            );
          }
        }
      }

      const today = new Date();
      const existing = await AttendanceRepository.findByStaffAndDate(
        staffId,
        today,
      );
      if (existing) {
        if (existing.clockOut) {
          this.conflict("Sudah absen hari ini.");
        } else {
          this.conflict("Belum clock-out dari absen hari ini.");
        }
      }

      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);

      const result = await AttendanceRepository.create({
        staffId,
        outletId,
        date: startOfDay,
        clockIn: today,
        notes: notes || "Absen masuk lewat portal",
        clockInLat: latitude ?? null,
        clockInLng: longitude ?? null,
        clockInFaceUrl: faceImageUrl ?? null,
      });

      if (registerFaceDescriptor && faceImageUrl) {
        await db.staff.update({
          where: { id: staffId },
          data: { faceImageUrl, faceDescriptor: registerFaceDescriptor },
        });
      }

      if (faceImageUrl && !registerFaceDescriptor) {
        ImageService.deleteImageByUrl(faceImageUrl);
      }

      return result;
    } else {
      const today = new Date();
      const attendance = await AttendanceRepository.findByStaffAndDate(
        staffId,
        today,
      );
      if (!attendance) {
        this.notFound("Belum absen masuk hari ini.");
      }
      if (attendance.clockOut) {
        this.conflict("Sudah clock-out.");
      }

      if (latitude !== undefined && longitude !== undefined) {
        const outlet = await AttendanceRepository.findOutletById(outletId);
        if (outlet && outlet.latitude != null && outlet.longitude != null) {
          const distance = haversineDistance(
            latitude,
            longitude,
            outlet.latitude,
            outlet.longitude,
          );
          if (distance > MAX_DISTANCE_METERS) {
            this.badRequest(
              `Anda berada di luar area outlet (${Math.round(distance)}m dari outlet, maksimal ${MAX_DISTANCE_METERS}m).`,
            );
          }
        }
      }

      const result = await AttendanceRepository.clockOut(attendance.id, {
        clockOut: today,
        notes: notes || "Absen pulang lewat portal",
        clockOutLat: latitude ?? null,
        clockOutLng: longitude ?? null,
        clockOutFaceUrl: faceImageUrl ?? null,
      });

      if (registerFaceDescriptor && faceImageUrl) {
        await db.staff.update({
          where: { id: staffId },
          data: { faceImageUrl, faceDescriptor: registerFaceDescriptor },
        });
      }

      if (faceImageUrl && !registerFaceDescriptor) {
        ImageService.deleteImageByUrl(faceImageUrl);
      }

      return result;
    }
  }
}
