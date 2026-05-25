import { BaseController } from "./base.controller";
import { IngredientService } from "../service/ingredient.service";

class IngredientController extends BaseController {
  create = this.handler(async (req, res) => {
    const data = await IngredientService.create(req.body);
    return this.success(res, data, 201, "Bahan baku berhasil dibuat");
  });

  getById = this.handler(async (req, res) => {
    const data = await IngredientService.getById(req.params.id as string);
    return this.success(res, data);
  });

  getByOutletId = this.handler(async (req, res) => {
    const { outletId } = req.params;
    const data = await IngredientService.getByOutletId(outletId as string);
    return this.success(res, data);
  });

  update = this.handler(async (req, res) => {
    const data = await IngredientService.update(req.params.id as string, req.body);
    return this.success(res, data, 200, "Bahan baku berhasil diperbarui");
  });

  delete = this.handler(async (req, res) => {
    await IngredientService.delete(req.params.id as string);
    return this.success(res, null, 200, "Bahan baku berhasil dihapus");
  });

  addStock = this.handler(async (req, res) => {
    const { id } = req.params;
    const { quantity, totalCost, referenceId, notes } = req.body;
    const data = await IngredientService.addStock(
      id as string,
      Number(quantity),
      Number(totalCost),
      referenceId,
      notes,
    );
    return this.success(res, data, 200, "Stok bahan baku berhasil ditambahkan");
  });

  adjustStock = this.handler(async (req, res) => {
    const { id } = req.params;
    const { quantity, notes } = req.body;
    const data = await IngredientService.adjustStock(
      id as string,
      Number(quantity),
      notes,
    );
    return this.success(res, data, 200, "Stok bahan baku berhasil disesuaikan");
  });
}

export const ingredientController = new IngredientController();
