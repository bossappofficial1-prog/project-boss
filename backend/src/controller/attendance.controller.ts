import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { AttendanceService } from "../service/attendance.service";
import { HttpStatus } from "../constants/http-status";
import { db } from "../config/prisma";

class AttendanceController extends BaseController {
  clockIn = this.handler(async (req: Request, res: Response) => {
    const { outletId, latitude, longitude, notes, clockInFaceUrl } = req.body;
    const user = req.storedUser as any;

    if (!user || (user.userType !== "CASHIER" && user.userType !== "MANAGER")) {
      return this.error(res, "Khusus staff (kasir/manager)", undefined, HttpStatus.FORBIDDEN);
    }

    const attendance = await AttendanceService.clockIn({
      staffId: user.id,
      outletId,
      latitude,
      longitude,
      notes,
      clockInFaceUrl,
    });
    return this.success(res, attendance, HttpStatus.CREATED, "Absen masuk berhasil");
  });

  clockOut = this.handler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { latitude, longitude, notes, clockOutFaceUrl } = req.body;
    const user = req.storedUser as any;

    if (!user || (user.userType !== "CASHIER" && user.userType !== "MANAGER")) {
      return this.error(res, "Khusus staff (kasir/manager)", undefined, HttpStatus.FORBIDDEN);
    }

    const attendance = await AttendanceService.clockOut({
      staffId: user.id,
      attendanceId: id,
      latitude,
      longitude,
      notes,
      clockOutFaceUrl,
    });
    return this.success(res, attendance, HttpStatus.OK, "Absen pulang berhasil");
  });

  me = this.handler(async (req: Request, res: Response) => {
    const user = req.storedUser as any;
    if (!user || user.userType !== "CASHIER") {
      return this.error(res, "Khusus kasir", undefined, HttpStatus.FORBIDDEN);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await AttendanceService.getMyAttendance(user.id, page, limit);
    return this.success(res, result);
  });

  today = this.handler(async (req: Request, res: Response) => {
    const user = req.storedUser as any;
    if (!user || user.userType !== "CASHIER") {
      return this.error(res, "Khusus kasir", undefined, HttpStatus.FORBIDDEN);
    }

    const attendance = await AttendanceService.getToday(user.id);
    return this.success(res, attendance);
  });

  listForOwner = this.handler(async (req: Request, res: Response) => {
    const user = req.storedUser as any;
    const outletId = req.query.outletId as string;
    const staffId = req.query.staffId as string;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Enforce manager can only view their own outlet
    if (user.role === "MANAGER" || user.userType === "MANAGER") {
      if (outletId !== user.outletId) {
        return this.error(res, "Akses ditolak. Manager hanya dapat melihat data absensi outlet sendiri.", undefined, HttpStatus.FORBIDDEN);
      }
    }

    const result = await AttendanceService.listForOwner({
      businessId: user.businessId,
      outletId,
      staffId,
      startDate,
      endDate,
      page,
      limit,
    });
    return this.success(res, result);
  });

  exportAttendance = this.handler(async (req: Request, res: Response) => {
    const user = req.storedUser as any;
    const outletId = req.query.outletId as string;
    const staffId = req.query.staffId as string;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!outletId) {
      return this.error(res, "Parameter outletId wajib diisi.", undefined, HttpStatus.BAD_REQUEST);
    }

    // Enforce manager can only export their own outlet
    if (user.role === "MANAGER" || user.userType === "MANAGER") {
      if (outletId !== user.outletId) {
        return this.error(res, "Akses ditolak. Manager hanya dapat mengekspor data absensi outlet sendiri.", undefined, HttpStatus.FORBIDDEN);
      }
    }

    const csvContent = await AttendanceService.exportAttendance({
      businessId: user.businessId,
      outletId,
      staffId,
      startDate,
      endDate,
    });

    const filename = `laporan-absensi-${outletId}-${startDate || "all"}-${endDate || "all"}.csv`;
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    
    // Add BOM for Excel UTF-8 compatibility
    res.send("\uFEFF" + csvContent);
  });

  createManual = this.handler(async (req: Request, res: Response) => {
    const user = req.storedUser as any;
    const { outletId, staffId, date, clockIn, clockOut, notes } = req.body;

    // Enforce manager can only register for their own outlet
    if (user.role === "MANAGER" || user.userType === "MANAGER") {
      if (outletId !== user.outletId) {
        return this.error(res, "Akses ditolak. Manager hanya dapat mencatat absensi outlet sendiri.", undefined, HttpStatus.FORBIDDEN);
      }
    }

    const attendance = await AttendanceService.createManual({
      businessId: user.businessId,
      outletId,
      staffId,
      date,
      clockIn,
      clockOut,
      notes,
    });

    return this.success(res, attendance, HttpStatus.CREATED, "Absensi staf berhasil ditambahkan manual");
  });

  updateManual = this.handler(async (req: Request, res: Response) => {
    const user = req.storedUser as any;
    const id = req.params.id as string;
    const { clockIn, clockOut, notes } = req.body;

    // Enforce manager can only modify for their own outlet
    if (user.role === "MANAGER" || user.userType === "MANAGER") {
      const attendance = await db.attendance.findUnique({
        where: { id },
      });
      if (!attendance || attendance.outletId !== user.outletId) {
        return this.error(res, "Akses ditolak. Manager hanya dapat mengubah absensi outlet sendiri.", undefined, HttpStatus.FORBIDDEN);
      }
    }

    const attendance = await AttendanceService.updateManual({
      id,
      businessId: user.businessId,
      clockIn,
      clockOut,
      notes,
    });

    return this.success(res, attendance, HttpStatus.OK, "Absensi staf berhasil diperbarui");
  });

  deleteManual = this.handler(async (req: Request, res: Response) => {
    const user = req.storedUser as any;
    const id = req.params.id as string;

    // Enforce manager can only delete for their own outlet
    if (user.role === "MANAGER" || user.userType === "MANAGER") {
      const attendance = await db.attendance.findUnique({
        where: { id },
      });
      if (!attendance || attendance.outletId !== user.outletId) {
        return this.error(res, "Akses ditolak. Manager hanya dapat menghapus absensi outlet sendiri.", undefined, HttpStatus.FORBIDDEN);
      }
    }

    await AttendanceService.deleteManual(id, user.businessId);
    return this.success(res, null, HttpStatus.OK, "Absensi staf berhasil dihapus");
  });

  portalClock = this.handler(async (req: Request, res: Response) => {
    const { staffId, pin, outletId, type, latitude, longitude, notes, faceImageUrl, registerFaceDescriptor } = req.body;

    const attendance = await AttendanceService.portalClock({
      staffId,
      pin,
      outletId,
      type,
      latitude,
      longitude,
      notes,
      faceImageUrl,
      registerFaceDescriptor,
    });

    const actionText = type === "in" ? "Absen masuk" : "Absen pulang";
    return this.success(res, attendance, HttpStatus.OK, `${actionText} berhasil`);
  });
}

export const attendanceController = new AttendanceController();
