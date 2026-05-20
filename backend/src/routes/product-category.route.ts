import { Router } from "express";
import { validateSchema } from "../middleware/zod.middleware";
import { createProductCategorySchema, updateProductCategorySchema } from "../schemas/product-category.schema";
import {
  createProductCategoryController,
  getProductCategoriesByOutletController,
  updateProductCategoryController,
  deleteProductCategoryController,
} from "../controller/product-category.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.post("/", validateSchema(createProductCategorySchema), createProductCategoryController);
router.get("/outlet/:outletId", getProductCategoriesByOutletController);
router.put("/:id", validateSchema(updateProductCategorySchema), updateProductCategoryController);
router.delete("/:id", deleteProductCategoryController);

export default router;
