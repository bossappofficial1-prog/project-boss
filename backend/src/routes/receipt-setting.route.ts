import { Router } from "express";
import { getReceiptSettingByOutletController, updateReceiptSettingController } from "../controller/receipt-setting.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { updateReceiptSettingSchema } from "../schemas/receipt-setting.schema";

const receiptRouter = Router()

receiptRouter.get('/:outletId', getReceiptSettingByOutletController)
receiptRouter.patch('/:outletId',
    validateSchema(updateReceiptSettingSchema),
    updateReceiptSettingController
)

export default receiptRouter