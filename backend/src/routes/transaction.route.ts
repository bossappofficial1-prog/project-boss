import { Router } from "express";
import { getTransactionListController, getTransactionByIdController } from "../controller/transaction.controller";
import { manualTransactionController } from "../controller/manual-transaction.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { StaffRole, UserRole } from "@prisma/client";
import { createManualTransactionSchema } from "../schemas/manual-transaction.schema";

const transactionRouter = Router();
transactionRouter.get(
    "/",
    protect,
    authorize(UserRole.OWNER, UserRole.ADMIN),
    getTransactionListController
);
transactionRouter.get(
    "/:id",
    protect,
    authorize(UserRole.OWNER, UserRole.ADMIN),
    getTransactionByIdController
);
transactionRouter.post(
    "/",
    protect,
    authorize(UserRole.OWNER, UserRole.ADMIN, StaffRole.MANAGER),
    validateSchema(createManualTransactionSchema),
    manualTransactionController.create
);

export default transactionRouter;
