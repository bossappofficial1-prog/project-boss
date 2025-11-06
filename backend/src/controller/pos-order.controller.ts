import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { ResponseUtil } from '../utils/response';
import { createPosOrderService } from '../service/pos-order.service';
import { CreatePosOrderInput } from '../schemas/pos-order.schema';

export const createPosOrderController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as CreatePosOrderInput;

    const result = await createPosOrderService(payload);
    return ResponseUtil.success(res, result);
});
