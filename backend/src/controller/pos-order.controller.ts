import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { createPosOrderService, getPosCashSummaryService } from "../service/pos-order.service";
import { CreatePosOrderInput } from "../schemas/pos-order.schema";

export const createPosOrderController = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreatePosOrderInput;
  const user = req.storedUser;

  // Jika user adalah kasir, inject ID kasir ke payload
  if (user && (user as any).userType === "CASHIER") {
    payload.cashierId = user.id;
  }

  const result = await createPosOrderService(payload);
  return ResponseUtil.success(res, result);
});

export const getPosCashSummaryController = asyncHandler(async (req: Request, res: Response) => {
  const outletId = String(req.query.outletId || req.params?.outletId || "");
  if (!outletId) {
    return ResponseUtil.badRequest(res, "Parameter outletId wajib diisi");
  }

  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  const summary = await getPosCashSummaryService({ outletId, date });

  return ResponseUtil.success(res, summary);
});
