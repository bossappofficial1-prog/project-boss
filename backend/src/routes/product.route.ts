import { Router } from "express";
import {
    bulkCreateProductsController,
    createProductController,
    deleteProductController,
    getProductByIdController,
    getProductsByOutletIdController,
    searchProductsByNameController,
    updateProductController,
    getProductImportTemplateController,
    exportProductsController
} from "../controller/product.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import upload from "../middleware/upload.middleware";
import { getBookingSlotByOutlet } from "../controller/booking.controller";

const productRouter = Router();

// Rute Publik (tidak perlu login)
productRouter.get("/search", searchProductsByNameController);
productRouter.get("/:id", getProductByIdController);
productRouter.get("/outlet/:outletId", getProductsByOutletIdController);
productRouter.get("/:productId/booking-slots", getBookingSlotByOutlet)

// Rute yang hanya bisa diakses oleh Owner
productRouter.get("/template/import", getProductImportTemplateController);
productRouter.get("/export/:outletId", protect, authorize(UserRole.OWNER), exportProductsController);
productRouter.post("/", protect, authorize(UserRole.OWNER), validateSchema(createProductSchema), createProductController);
productRouter.post("/bulk", protect, authorize(UserRole.OWNER), upload.single('file'), bulkCreateProductsController);
productRouter.patch("/:id", protect, authorize(UserRole.OWNER), validateSchema(updateProductSchema), updateProductController);
productRouter.delete("/:id", protect, authorize(UserRole.OWNER), deleteProductController);

export default productRouter;