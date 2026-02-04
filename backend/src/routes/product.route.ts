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
import { authorize, protect, authorizeOwnerOrCashier } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { importUpload } from "../middleware/upload.middleware";
import { getAvailableStaffForProductController, getBookingSlotByOutlet } from "../controller/booking.controller";
import { checkProductLimit } from "../middleware/subscription-limits.middleware";

const productRouter = Router();

// Rute Publik (tidak perlu login)
productRouter.get("/search", searchProductsByNameController);
productRouter.get("/:id", getProductByIdController);
productRouter.get("/outlet/:outletId", getProductsByOutletIdController);
productRouter.get("/:productId/booking-slots", getBookingSlotByOutlet)
productRouter.get("/:productId/available-staff", getAvailableStaffForProductController)

// Rute yang hanya bisa diakses oleh Owner
productRouter.get("/template/import", getProductImportTemplateController);
productRouter.use(protect, authorize(UserRole.OWNER))
productRouter.get("/export/:outletId", exportProductsController);
productRouter.post("/", checkProductLimit, validateSchema(createProductSchema), createProductController);
productRouter.post("/bulk", checkProductLimit, importUpload.single('file'), bulkCreateProductsController);
productRouter.patch("/:id", validateSchema(updateProductSchema), updateProductController);
productRouter.delete("/:id", deleteProductController);

export default productRouter;