import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { CashierShiftService } from "../service/cashier-shift.service";
import { HttpStatus } from "../constants/http-status";

class CashierShiftController extends BaseController {
  getActive = this.handler(async (req: Request, res: Response) => {
    const outletId = req.query.outletId as string;
    const user = req.storedUser as any;

    if (!outletId) {
      return this.error(res, "Parameter outletId wajib diisi", undefined, HttpStatus.BAD_REQUEST);
    }
    if (!user || user.userType !== "CASHIER") {
      return this.error(res, "Khusus kasir", undefined, HttpStatus.FORBIDDEN);
    }

    const shift = await CashierShiftService.getActiveShift({ outletId, staffId: user.id });
    return this.success(res, shift);
  });

  open = this.handler(async (req: Request, res: Response) => {
    const { outletId, openingCash = 0, notes } = req.body as {
      outletId: string;
      openingCash?: number;
      notes?: string;
    };
    const user = req.storedUser as any;

    if (!user || user.userType !== "CASHIER") {
      return this.error(res, "Khusus kasir", undefined, HttpStatus.FORBIDDEN);
    }
    if (user.outletId && user.outletId !== outletId) {
      return this.error(res, "Outlet tidak sesuai sesi kasir", undefined, HttpStatus.FORBIDDEN);
    }

    const shift = await CashierShiftService.openShift({
      outletId,
      staffId: user.id,
      openingCash,
      notes,
    });
    return this.success(res, shift, HttpStatus.CREATED, "Shift berhasil dibuka");
  });

  close = this.handler(async (req: Request, res: Response) => {
    const shiftId = req.params.shiftId as string;
    const { closingCash, notes } = req.body as { closingCash: number; notes?: string };
    const user = req.storedUser as any;

    if (!user || user.userType !== "CASHIER") {
      return this.error(res, "Khusus kasir", undefined, HttpStatus.FORBIDDEN);
    }

    const shift = await CashierShiftService.closeShift({
      shiftId,
      staffId: user.id,
      closingCash,
      notes,
    });
    return this.success(res, shift, HttpStatus.OK, "Shift berhasil ditutup");
  });

  createMovement = this.handler(async (req: Request, res: Response) => {
    const shiftId = req.params.shiftId as string;
    const { type, amount, note } = req.body as any;
    const user = req.storedUser as any;

    if (!user || user.userType !== "CASHIER") {
      return this.error(res, "Khusus kasir", undefined, HttpStatus.FORBIDDEN);
    }

    const movement = await CashierShiftService.createMovement({
      shiftId,
      staffId: user.id,
      type,
      amount,
      note,
    });
    return this.success(res, movement, HttpStatus.CREATED, "Cash movement berhasil dicatat");
  });

  listForOwner = this.handler(async (req: Request, res: Response) => {
    const outletId = req.query.outletId as string;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const user = req.storedUser as any;

    if (!outletId) {
      return this.error(res, "Parameter outletId wajib diisi", undefined, HttpStatus.BAD_REQUEST);
    }
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    const shifts = await CashierShiftService.listShiftsForOwner({
      businessId: user.businessId,
      outletId,
      from: fromDate,
      to: toDate,
    });
    return this.success(res, shifts);
  });
}

export const cashierShiftController = new CashierShiftController();
