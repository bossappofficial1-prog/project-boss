import { Router } from "express";
import {
  requestDeleteTransactionController,
  approveDeleteRequestController,
  rejectDeleteRequestController,
  getDeleteRequestsController,
  directDeleteTransactionController,
} from "../controller/transaction-delete.controller";
import { authorize, protect, authorizeOwnerOrManager } from "../middleware/auth.middleware";
import { authorizePrivilege } from "../middleware/privilege.middleware";
import { UserRole, StaffPrivilegeType } from "@prisma/client";

const transactionDeleteRouter = Router();

// Kasir request hapus
transactionDeleteRouter.post(
  "/request",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  requestDeleteTransactionController,
);

// Owner/Manager get list
transactionDeleteRouter.get(
  "/",
  protect,
  authorizeOwnerOrManager,
  getDeleteRequestsController,
);

// Owner/Manager approve request kasir
transactionDeleteRouter.post(
  "/:id/approve",
  protect,
  authorizeOwnerOrManager,
  approveDeleteRequestController,
);

// Owner reject request kasir
transactionDeleteRouter.post(
  "/:id/reject",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  rejectDeleteRequestController,
);

// Manager direct delete (bypass approval)
transactionDeleteRouter.post(
  "/:id/direct-delete",
  protect,
  authorizePrivilege(StaffPrivilegeType.TRANSACTION_DELETE),
  directDeleteTransactionController,
);

export default transactionDeleteRouter;
