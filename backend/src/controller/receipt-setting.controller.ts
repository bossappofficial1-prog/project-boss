import { asyncHandler } from "../middleware/error.middleware";
import { ReceiptSettingService } from "../service/receipt-settin.service";
import { Request, Response } from "express"
import { ResponseUtil } from "../utils";
import { updateReceiptSettingValues } from "../schemas/receipt-setting.schema";

export const getReceiptSettingByOutletController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string
    const receiptSetting = await ReceiptSettingService.getByOutlet(outletId)

    return ResponseUtil.success(res, receiptSetting, 200)
})

export const updateReceiptSettingController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string
    const data = req.body as updateReceiptSettingValues
    const receiptSetting = await ReceiptSettingService.update(outletId, data)

    return ResponseUtil.success(res, receiptSetting, 200)
})