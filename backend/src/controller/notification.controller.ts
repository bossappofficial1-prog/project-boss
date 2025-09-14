
import { Request, Response } from 'express';
import { getLatestNotificationsService } from '../service/notification.service';
import { asyncHandler } from '../middleware/error.middleware';
import { ResponseUtil } from '../utils';
import { Messages } from '../constants/message';

export const getNotificationsController = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = (req as any).user?.id as string;
    const { outletId, threshold } = req.query as { outletId?: string; threshold?: string };

    if (!outletId) {
        return ResponseUtil.error(res, Messages.BAD_REQUEST, undefined, 400);
    }

    const lowStockThreshold = threshold ? parseInt(threshold, 10) : undefined;

    const result = await getLatestNotificationsService({ outletId, ownerId, lowStockThreshold });
    return ResponseUtil.success(res, result)
});
