import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { ReservationService } from "../service/reservation.service";
import { AppError } from "../errors/app-error";

class ReservationController extends BaseController {
  createReservation = this.handler(async (req: Request, res: Response) => {
    const data = req.body;
    const staffId = req.storedCashier?.id;
    const result = await ReservationService.createReservation(data, staffId);
    return this.success(res, result, 201, "Reservasi berhasil dibuat");
  });

  getReservations = this.handler(async (req: Request, res: Response) => {
    const query = req.query as any;
    const result = await ReservationService.getReservations(query);
    return this.success(res, result);
  });

  updateReservationStatus = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const outletId = req.query.outletId as string;

    if (!outletId) {
      throw new AppError("ID Outlet wajib diisi", 400);
    }

    const result = await ReservationService.updateReservationStatus(id as string, status, outletId);
    return this.success(res, result, 200, "Status reservasi berhasil diperbarui");
  });
}

export const reservationController = new ReservationController();
