import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { SupplierService } from "../service/supplier.service";
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierQuerySchema,
} from "../schemas/supplier.schema";

class SupplierController extends BaseController {
  getAll = this.handler(async (req: Request, res: Response) => {
    const query = supplierQuerySchema.parse(req.query);
    const result = await SupplierService.getAll(query);
    return this.paginated(
      res,
      result.data,
      result.page,
      result.limit,
      result.total,
      {
        totalPages: result.totalPages,
      },
    );
  });

  getById = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const supplier = await SupplierService.getById(id as string);
    return this.success(res, supplier);
  });

  create = this.handler(async (req: Request, res: Response) => {
    const data = createSupplierSchema.parse(req.body);
    const supplier = await SupplierService.create(data);
    return this.success(res, supplier, 201);
  });

  update = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = updateSupplierSchema.parse(req.body);
    const supplier = await SupplierService.update(id as string, data);
    return this.success(res, supplier);
  });

  delete = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await SupplierService.delete(id as string);
    return this.success(res, null);
  });

  getByProduct = this.handler(async (req: Request, res: Response) => {
    const { productGoodsId } = req.params;
    const suppliers = await SupplierService.getByProduct(
      productGoodsId as string,
    );
    return this.success(res, suppliers);
  });
}

export const supplierController = new SupplierController();
