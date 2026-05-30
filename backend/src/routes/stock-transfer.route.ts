import { Router } from "express";
import { stockTransferController } from "../controller/stock-transfer.controller";
import { validateSchema } from "../middleware/zod.middleware";
import {
  createStockTransferSchema,
  updateStockTransferStatusSchema,
} from "../schemas/stock-transfer.schema";
import { protect } from "../middleware/auth.middleware";

const stockTransferRouter = Router();

// All stock transfer endpoints are protected by authentication
stockTransferRouter.use(protect);

stockTransferRouter.post(
  "/",
  validateSchema(createStockTransferSchema),
  stockTransferController.create
);

stockTransferRouter.get("/", stockTransferController.getAll);
stockTransferRouter.get("/:id", stockTransferController.getById);

stockTransferRouter.patch(
  "/:id/status",
  validateSchema(updateStockTransferStatusSchema),
  stockTransferController.updateStatus
);

export default stockTransferRouter;
