import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { QueueV2Service } from "../service/queue-v2.service";
import type { RescheduleQueueInput } from "../schemas/queue-v2.schema";

export const queueV2GetBoard = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const user = req.storedUser!;

    const q = req.query.q as string

    const isCashier = (user as any).userType === "CASHIER";
    const userIdentifier = isCashier ? (user as any).outletId : user.id;
    const validateAsOwner = !isCashier;

    const result = await QueueV2Service.getBoard(outletId, userIdentifier, validateAsOwner, q);
    return ResponseUtil.success(res, result);
});

export const queueV2TransitionStatus = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const { status, reason } = req.body;
    const user = req.storedUser!;

    const isCashier = (user as any).userType === "CASHIER";
    const userIdentifier = isCashier ? (user as any).outletId : user.id;
    const validateAsOwner = !isCashier;

    const result = await QueueV2Service.transitionStatus(
        orderId,
        userIdentifier,
        status,
        validateAsOwner,
        reason,
    );
    return ResponseUtil.success(res, result);
});

export const queueV2Reschedule = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const { newSlotId, newDate, newStartTime, newEndTime } = req.body as RescheduleQueueInput;
    const user = req.storedUser!;

    const isCashier = (user as any).userType === "CASHIER";
    const userIdentifier = isCashier ? (user as any).outletId : user.id;
    const validateAsOwner = !isCashier;

    const result = await QueueV2Service.rescheduleBooking(
        orderId,
        userIdentifier,
        validateAsOwner,
        newSlotId,
        new Date(newDate),
        new Date(newStartTime),
        new Date(newEndTime),
    );
    return ResponseUtil.success(res, result, undefined, "Jadwal berhasil diperbarui.");
});
