import { Router } from "express";
import {
  requestDeleteTransactionController,
  approveDeleteRequestController,
  rejectDeleteRequestController,
  getDeleteRequestsController,
} from "../controller/transaction-delete.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const transactionDeleteRouter = Router();

transactionDeleteRouter.post(
  "/request",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  requestDeleteTransactionController,
);

transactionDeleteRouter.get(
  "/",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  getDeleteRequestsController,
);

transactionDeleteRouter.post(
  "/:id/approve",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  approveDeleteRequestController,
);

transactionDeleteRouter.post(
  "/:id/reject",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  rejectDeleteRequestController,
);

export default transactionDeleteRouter;
