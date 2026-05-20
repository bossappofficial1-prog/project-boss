import { Request, Response } from "express";
import { ResponseUtil } from "../utils";
import { HttpStatus } from "../constants/http-status";
import { asyncHandler } from "../middleware/error.middleware";
import { TransactionDeleteService } from "../service/transaction-delete.service";
import {
  requestDeleteTransactionSchema,
  approveDeleteRequestSchema,
  rejectDeleteRequestSchema,
} from "../schemas/transaction-delete.schema";

export const requestDeleteTransactionController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).storedUser?.id;
  const staffId = (req as any).storedStaff?.id;

  const requesterId = staffId || userId;
  if (!requesterId) {
    return ResponseUtil.unauthorized(res, "Unauthorized");
  }

  const validated = requestDeleteTransactionSchema.parse(req.body);

  const result = await TransactionDeleteService.requestDeleteTransaction({
    transactionId: validated.transactionId,
    cashierId: requesterId,
    reason: validated.reason,
  });

  return ResponseUtil.created(
    res,
    result,
    "Permintaan penghapusan berhasil dikirim ke Owner",
  );
});

export const approveDeleteRequestController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).storedUser?.id;
  if (!userId) {
    return ResponseUtil.unauthorized(res, "Unauthorized");
  }

  const { id } = req.params;
  const validated = approveDeleteRequestSchema.parse({ requestId: id });

  const result = await TransactionDeleteService.approveDeleteRequest({
    requestId: validated.requestId,
    ownerId: userId,
  });

  return ResponseUtil.success(res, result, "Permintaan penghapusan disetujui");
});

export const rejectDeleteRequestController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).storedUser?.id;
  if (!userId) {
    return ResponseUtil.unauthorized(res, "Unauthorized");
  }

  const { id } = req.params;
  const validated = rejectDeleteRequestSchema.parse({
    requestId: id,
    rejectionNote: req.body.rejectionNote,
  });

  const result = await TransactionDeleteService.rejectDeleteRequest({
    requestId: validated.requestId,
    ownerId: userId,
    rejectionNote: validated.rejectionNote,
  });

  return ResponseUtil.success(res, result, "Permintaan penghapusan ditolak");
});

export const getDeleteRequestsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).storedUser?.id;
  if (!userId) {
    return ResponseUtil.unauthorized(res, "Unauthorized");
  }

  const { outletId, status } = req.query;

  let requests: any[] = [];

  if (outletId) {
    requests = await TransactionDeleteService.getDeleteRequestsByOutlet(
      outletId as string,
      status as string | undefined,
    );
  } else {
    requests = await TransactionDeleteService.getOwnerPendingRequests(userId);
  }

  return ResponseUtil.success(res, requests, "Berhasil mengambil daftar permintaan penghapusan");
});
