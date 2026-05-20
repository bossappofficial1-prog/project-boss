import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { AttendanceService } from "../service/attendance.service";
import { HttpStatus } from "../constants/http-status";

class AttendanceController extends BaseController {
  clockIn = this.handler(async (req: Request, res: Response) => {
    const { outletId, latitude, longitude, notes } = req.body;
    const user = req.storedUser as any;

    if (!user || user.userType !== "CASHIER") {
      return this.error(res, "Khusus kasir", undefined, HttpStatus.FORBIDDEN);
    }
    if (user.outletId && user.outletId !== outletId) {
      return this.error(res, "Outlet tidak sesuai sesi kasir", undefined, HttpStatus.FORBIDDEN);
    }

    const attendance = await AttendanceService.clockIn({
      staffId: user.id,
      outletId,
      latitude,
      longitude,
      notes,
    });
    return this.success(res, attendance, HttpStatus.CREATED, "Absen masuk berhasil");
  });

  clockOut = this.handler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { latitude, longitude, notes } = req.body;
    const user = req.storedUser as any;

    if (!user || user.userType !== "CASHIER") {
      return this.error(res, "Khusus kasir", undefined, HttpStatus.FORBIDDEN);
    }

    const attendance = await AttendanceService.clockOut({
      staffId: user.id,
      attendanceId: id,
      latitude,
      longitude,
      notes,
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
}

export const attendanceController = new AttendanceController();
