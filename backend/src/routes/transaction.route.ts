import { Router } from "express";
import { getTransactionListController, getTransactionByIdController } from "../controller/transaction.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

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

export default transactionRouter;
