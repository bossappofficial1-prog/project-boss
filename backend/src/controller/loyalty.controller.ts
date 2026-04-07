import { Request, Response } from "express";
import { LoyaltyService } from "../service/loyalty.service";
import {
  upsertLoyaltyConfigSchema,
  registerMembershipSchema,
  getMembersByOutletQuerySchema,
  adjustPointsSchema,
  getPointHistoryQuerySchema,
} from "../schemas/loyalty.schema";
import { HttpStatus } from "../constants/http-status";

export class LoyaltyController {
  static async getConfig(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const config = await LoyaltyService.getConfig(outletId);
    return res.status(HttpStatus.OK).json(config);
  }

  static async upsertConfig(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const body = upsertLoyaltyConfigSchema.parse(req.body);
    const config = await LoyaltyService.upsertConfig(outletId, body);
    return res.status(HttpStatus.OK).json({
      message: "Konfigurasi loyalty berhasil diperbarui.",
      data: config
    });
  }

  static async registerMember(req: Request, res: Response) {
    const data = registerMembershipSchema.parse(req.body);
    const membership = await LoyaltyService.registerMember(data);
    return res.status(HttpStatus.CREATED).json({
      message: "Member berhasil didaftarkan.",
      data: membership
    });
  }

  static async getMembers(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const query = getMembersByOutletQuerySchema.parse(req.query);
    const result = await LoyaltyService.getMembers(
      outletId,
      query.search,
      query.page,
      query.limit
    );
    return res.status(HttpStatus.OK).json(result);
  }

  static async adjustPoints(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const guestCustomerId = req.params.guestCustomerId as string;
    const { points } = adjustPointsSchema.parse(req.body);

    const result = await LoyaltyService.adjustPoints(guestCustomerId, outletId, points);
    return res.status(HttpStatus.OK).json(result);
  }

  static async getPointHistory(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const guestCustomerId = req.params.guestCustomerId as string;
    const query = getPointHistoryQuerySchema.parse(req.query);

    const result = await LoyaltyService.getMemberPointHistory(
      outletId,
      guestCustomerId,
      query.page,
      query.limit,
    );

    return res.status(HttpStatus.OK).json(result);
  }
}
