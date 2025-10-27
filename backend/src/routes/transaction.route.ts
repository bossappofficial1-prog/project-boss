import { Router } from "express";
import { getTransactionListController, getTransactionByIdController } from "../controller/transaction.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const transactionRouter = Router();

/**
 * @route   GET /api/v1/transactions
 * @desc    Get list of transactions and expenses with filters
 * @access  Private (OWNER, ADMIN)
 * @query   {string} outletId - Filter by specific outlet (optional)
 * @query   {string} status - Filter by payment status (optional)
 * @query   {string} type - Filter by type: INCOME, EXPENSE, or ALL (optional, default: ALL)
 * @query   {string} startDate - Filter from date (optional)
 * @query   {string} endDate - Filter to date (optional)
 * @query   {number} page - Page number for pagination (default: 1)
 * @query   {number} limit - Items per page (default: 10)
 */
transactionRouter.get(
    "/",
    protect,
    authorize(UserRole.OWNER, UserRole.ADMIN),
    getTransactionListController
);

/**
 * @route   GET /api/v1/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private (OWNER, ADMIN)
 */
transactionRouter.get(
    "/:id",
    protect,
    authorize(UserRole.OWNER, UserRole.ADMIN),
    getTransactionByIdController
);

export default transactionRouter;
