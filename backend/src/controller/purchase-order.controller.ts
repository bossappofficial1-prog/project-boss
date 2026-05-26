import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { PurchaseOrderService } from "../service/purchase-order.service";
import { PurchaseOrderRepository } from "../repositories/purchase-order.repository";
import {
  purchaseOrderQuerySchema,
  updatePOItemsSchema,
} from "../schemas/purchase-order.schema";

class PurchaseOrderController extends BaseController {
  getAll = this.handler(async (req: Request, res: Response) => {
    const query = purchaseOrderQuerySchema.parse(req.query);
    const result = await PurchaseOrderRepository.findAll(query);
    return this.paginated(
      res,
      result.data,
      result.page,
      result.limit,
      result.total,
      {
        totalPages: result.totalPages,
      }
    );
  });

  getById = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const po = await PurchaseOrderRepository.findById(id as string);
    if (!po) {
      return this.error(res, "Purchase Order tidak ditemukan", undefined, 404);
    }
    return this.success(res, po);
  });

  updateDraftItems = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { items, notes } = updatePOItemsSchema.parse(req.body);
    
    // Pastikan PO ada dan berstatus DRAFT sebelum diupdate
    const po = await PurchaseOrderRepository.findById(id as string);
    if (!po) {
      return this.error(res, "Purchase Order tidak ditemukan", undefined, 404);
    }
    if (po.status !== "DRAFT") {
      return this.error(res, "Hanya draf Purchase Order yang dapat diedit", undefined, 400);
    }

    const updatedPo = await PurchaseOrderRepository.updateDraftItems(id as string, items, notes);
    return this.success(res, updatedPo);
  });

  sendPO = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PurchaseOrderService.sendPOToSupplier(id as string);
    return this.success(res, result, 200, "Purchase Order berhasil dikirim ke Supplier");
  });

  completePO = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PurchaseOrderService.completePurchaseOrder(id as string);
    return this.success(res, result, 200, "Purchase Order berhasil diselesaikan dan stok telah ditambahkan");
  });
}

export const purchaseOrderController = new PurchaseOrderController();
