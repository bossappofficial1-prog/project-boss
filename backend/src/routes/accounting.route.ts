import { Router } from "express";
import { accountingController } from "../controller/accounting.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { requireActiveSubscription, requireSubscriptionPlan } from "../middleware/subscription.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { createAccountSchema, updateAccountSchema, createJournalEntrySchema } from "../schemas/accounting.schema";
import { UserRole } from "@prisma/client";

const accountingRouter = Router();

// Protect all accounting routes and restrict to OWNER role
accountingRouter.use(protect);
accountingRouter.use(authorize(UserRole.OWNER));
accountingRouter.use(requireActiveSubscription);

// Restrict strictly to TRIAL, PRO, and ENTERPRISE plans
accountingRouter.use(requireSubscriptionPlan(["TRIAL", "PRO", "ENTERPRISE"]));

// Chart of Accounts (COA) Routes
accountingRouter.get("/accounts", accountingController.getAccounts);
accountingRouter.post("/accounts", validateSchema(createAccountSchema), accountingController.createAccount);
accountingRouter.patch("/accounts/:id", validateSchema(updateAccountSchema), accountingController.updateAccount);
accountingRouter.delete("/accounts/:id", accountingController.deleteAccount);

// Journal Entries Routes
accountingRouter.get("/journal-entries", accountingController.getJournalEntries);
accountingRouter.post("/journal-entries", validateSchema(createJournalEntrySchema), accountingController.createJournalEntry);
accountingRouter.delete("/journal-entries/:id", accountingController.deleteJournalEntry);

// Financial Reports Routes
accountingRouter.get("/reports/balance-sheet", accountingController.getBalanceSheet);
accountingRouter.get("/reports/profit-loss", accountingController.getProfitLoss);

export default accountingRouter;
