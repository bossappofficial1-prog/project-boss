import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { StockTransferService } from "../service/stock-transfer.service";

class StockTransferController extends BaseController {
  create = this.handler(async (req: Request, res: Response) => {
    const payload = req.body;
    const userId = req.storedUser!.id;
    const result = await StockTransferService.create(payload, userId);
    return this.success(res, result, 201, "Permintaan transfer stok berhasil dibuat.");
  });

  getById = this.handler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.storedUser!.id;
    const result = await StockTransferService.getById(id, userId);
    return this.success(res, result);
  });

  getAll = this.handler(async (req: Request, res: Response) => {
    const query = req.query;
    const userId = req.storedUser!.id;
    const result = await StockTransferService.getAll(query, userId);
    return this.paginated(
      res,
      result.data,
      result.page,
      result.limit,
      result.total
    );
  });

  updateStatus = this.handler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;
    const userId = req.storedUser!.id;
    const result = await StockTransferService.updateStatus(id, status, userId);
    return this.success(res, result, 200, "Status transfer stok berhasil diperbarui.");
  });
}

export const stockTransferController = new StockTransferController();
