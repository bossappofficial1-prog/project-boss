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

  return ResponseUtil.success(res, result, HttpStatus.CREATED, "Permintaan penghapusan berhasil dikirim ke Owner");
});

export const approveDeleteRequestController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).storedUser;
  if (!user) {
    return ResponseUtil.unauthorized(res, "Unauthorized");
  }

  const { id } = req.params as { id: string };
  const validated = approveDeleteRequestSchema.parse({ requestId: id });

  const isManager = user.userType === "MANAGER" || user.role === "MANAGER";
  const approverId: string = user.id;
  const approverRole: "owner" | "manager" = isManager ? "manager" : "owner";

  const result = await TransactionDeleteService.approveDeleteRequest({
    requestId: validated.requestId,
    approverId,
    approverRole,
  });

  return ResponseUtil.success(res, result, HttpStatus.OK, "Permintaan penghapusan disetujui");
});

export const rejectDeleteRequestController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).storedUser?.id;
  if (!userId) {
    return ResponseUtil.unauthorized(res, "Unauthorized");
  }

  const { id } = req.params as { id: string };
  const validated = rejectDeleteRequestSchema.parse({
    requestId: id,
    rejectionNote: req.body.rejectionNote,
  });

  const result = await TransactionDeleteService.rejectDeleteRequest({
    requestId: validated.requestId,
    ownerId: userId,
    rejectionNote: validated.rejectionNote,
  });

  return ResponseUtil.success(res, result, HttpStatus.OK, "Permintaan penghapusan ditolak");
});

export const getDeleteRequestsController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).storedUser;
  if (!user) {
    return ResponseUtil.unauthorized(res, "Unauthorized");
  }

  const outletId = req.query.outletId as string | undefined;
  const status = req.query.status as string | undefined;

  let requests: any[] = [];

  if (outletId) {
    requests = await TransactionDeleteService.getDeleteRequestsByOutlet(outletId, status);
  } else {
    requests = await TransactionDeleteService.getOwnerPendingRequests(user.id);
  }

  return ResponseUtil.success(res, requests, HttpStatus.OK, "Berhasil mengambil daftar permintaan penghapusan");
});

export const directDeleteTransactionController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).storedUser;
  if (!user) {
    return ResponseUtil.unauthorized(res, "Unauthorized");
  }

  const { id } = req.params as { id: string };
  const reason = req.body.reason as string | undefined;

  const result = await TransactionDeleteService.directDeleteTransaction({
    transactionId: id,
    managerId: user.id,
    reason,
  });

  return ResponseUtil.success(res, result, HttpStatus.OK, result.message);
});
