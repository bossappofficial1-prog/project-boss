import { Router } from "express";
import {
  getTransactionListController,
  getTransactionByIdController,
} from "../controller/transaction.controller";
import { manualTransactionController } from "../controller/manual-transaction.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { StaffRole, UserRole } from "@prisma/client";
import {
  createManualTransactionSchema,
  updateManualTransactionSchema,
} from "../schemas/manual-transaction.schema";

const transactionRouter = Router();
transactionRouter.get(
  "/",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  getTransactionListController,
);
transactionRouter.get(
  "/:id",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  getTransactionByIdController,
);
transactionRouter.post(
  "/",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN, StaffRole.MANAGER),
  validateSchema(createManualTransactionSchema),
  manualTransactionController.create,
);
transactionRouter.patch(
  "/:id",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN, StaffRole.MANAGER),
  validateSchema(updateManualTransactionSchema),
  manualTransactionController.update,
);
transactionRouter.delete(
  "/:id",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN, StaffRole.MANAGER),
  manualTransactionController.delete,
);

export default transactionRouter;
