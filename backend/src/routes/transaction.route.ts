import { Router } from "express";
import { getTransactionListController, getTransactionByIdController } from "../controller/transaction.controller";
import { manualTransactionController } from "../controller/manual-transaction.controller";
import { authorize, protect, validate } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
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
    authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER),
    validate(createManualTransactionSchema),
    manualTransactionController.create
);

export default transactionRouter;
