import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { AiService } from "../service/ai.service";
import { BusinessRepository } from "../repositories/business.repository";
import { HttpStatus } from "../constants/http-status";

class AiController extends BaseController {
  analyze = this.handler(async (req: Request, res: Response) => {
    const businessId = req.storedUser!.businessId;
    
    // Fetch business name via repository
    const business = await BusinessRepository.findById(businessId);
    const businessName = business?.name || "UMKM Boss";

    const regenerate = req.query.regenerate === "true";

    const result = await AiService.analyzeBusiness(businessId, businessName, regenerate);
    return this.success(res, result, HttpStatus.OK, "Analisis bisnis berhasil dibuat");
  });
}

export const aiController = new AiController();
