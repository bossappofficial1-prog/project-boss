import { Request, Response } from "express";
import { BillStatus } from "@prisma/client";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { ensureString } from "../utils/request";
import { BillService } from "../service/bill.service";

export const createBillController = asyncHandler(async (req: Request, res: Response) => {
  const outletId = ensureString(req.body?.outletId, "outletId");
  const tableId = ensureString(req.body?.tableId, "tableId");

  const bill = await BillService.createBill(outletId, tableId);
  return ResponseUtil.success(res, bill, 201, "Bill berhasil dibuat");
});

export const getBillByIdController = asyncHandler(async (req: Request, res: Response) => {
  const id = ensureString(req.params?.id, "id");
  const bill = await BillService.getBillById(id);
  return ResponseUtil.success(res, bill);
});

export const listBillsController = asyncHandler(async (req: Request, res: Response) => {
  const outletId = ensureString(req.query?.outletId, "outletId");
  const status = typeof req.query?.status === "string" ? req.query.status : undefined;

  if (status && !Object.values(BillStatus).includes(status as BillStatus)) {
    return ResponseUtil.badRequest(res, "Status bill tidak valid");
  }

  const bills = await BillService.listBills(outletId, status as BillStatus | undefined);
  return ResponseUtil.success(res, bills);
});

export const payBillController = asyncHandler(async (req: Request, res: Response) => {
  const id = ensureString(req.params?.id, "id");
  const bill = await BillService.payBill(id);
  return ResponseUtil.success(res, bill, 200, "Bill berhasil dibayar");
});