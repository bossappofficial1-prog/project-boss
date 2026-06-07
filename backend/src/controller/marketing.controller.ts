import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MarketingService } from "../service/marketing.service";
import { HttpStatus } from "../constants/http-status";

class MarketingController extends BaseController {
  sendBroadcast = this.handler(async (req: Request, res: Response) => {
    const businessId = req.storedUser!.businessId;
    const result = await MarketingService.sendBroadcast(businessId, req.body);
    return this.success(res, result, HttpStatus.ACCEPTED, "Pesan siaran berhasil dijadwalkan");
  });
}

export const marketingController = new MarketingController();
