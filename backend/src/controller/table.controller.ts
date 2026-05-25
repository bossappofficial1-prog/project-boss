import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { TableService } from "../service/table.service";
import { CreateTableInput, UpdateTableInput } from "../schemas/table.schema";
import { ensureString } from "../utils/request";

export const createTable = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateTableInput;
  const result = await TableService.create(data);
  return ResponseUtil.success(res, result, 201, "Meja berhasil ditambahkan");
});

export const getTables = asyncHandler(async (req: Request, res: Response) => {
  const outletId = req.query.outletId as string;
  if (!outletId) return ResponseUtil.badRequest(res, "ID Outlet wajib diisi");
  const result = await TableService.findAll(outletId);
  return ResponseUtil.success(res, result);
});

export const getTableById = asyncHandler(async (req: Request, res: Response) => {
  const id = ensureString(req.params?.id, "id");
  const result = await TableService.findById(id);
  return ResponseUtil.success(res, result);
});

export const updateTable = asyncHandler(async (req: Request, res: Response) => {
  const id = ensureString(req.params?.id, "id");
  const data = req.body as UpdateTableInput;
  const result = await TableService.update(id, data);
  return ResponseUtil.success(res, result, 200, "Meja berhasil diperbarui");
});

export const deleteTable = asyncHandler(async (req: Request, res: Response) => {
  const id = ensureString(req.params?.id, "id");
  await TableService.delete(id);
  return ResponseUtil.success(res, null, 200, "Meja berhasil dihapus");
});
