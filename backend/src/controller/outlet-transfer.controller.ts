import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import {
    createTransferRequestService,
    acceptTransferRequestService,
    rejectTransferRequestService,
    cancelTransferRequestService,
    getIncomingTransfersService,
    getOutgoingTransfersService
} from "../service/outlet-transfer.service";

export const createTransferRequestController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const { receiverEmail, note } = req.body;
    const senderId = req.storedUser!.id;

    if (!receiverEmail) {
        return ResponseUtil.badRequest(res, "Email penerima diperlukan.");
    }

    const request = await createTransferRequestService(outletId as string, senderId, receiverEmail, note);
    return ResponseUtil.success(res, request, HttpStatus.CREATED, "Permintaan transfer berhasil dibuat.");
});

export const acceptTransferRequestController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.storedUser!.id;

    await acceptTransferRequestService(id as string, userId);
    return ResponseUtil.success(res, null, HttpStatus.OK, "Permintaan transfer berhasil diterima.");
});

export const rejectTransferRequestController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.storedUser!.id;

    await rejectTransferRequestService(id as string, userId);
    return ResponseUtil.success(res, null, HttpStatus.OK, "Permintaan transfer berhasil ditolak.");
});

export const cancelTransferRequestController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.storedUser!.id;

    await cancelTransferRequestService(id as string, userId);
    return ResponseUtil.success(res, null, HttpStatus.OK, "Permintaan transfer berhasil dibatalkan.");
});

export const getIncomingTransfersController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.storedUser!.id;
    const transfers = await getIncomingTransfersService(userId);
    return ResponseUtil.success(res, transfers);
});

export const getOutgoingTransfersController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.storedUser!.id;
    const transfers = await getOutgoingTransfersService(userId);
    return ResponseUtil.success(res, transfers);
});
