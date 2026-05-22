import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import { UserRole, StaffRole } from "@prisma/client";
import { createBillController, getBillByIdController, listBillsController, payBillController } from "../controller/bill.controller";

const billRouter = Router();

billRouter.use(protect, authorize(UserRole.OWNER, StaffRole.CASHIER));
billRouter.post("/", createBillController);
billRouter.get("/", listBillsController);
billRouter.get("/:id", getBillByIdController);
billRouter.put("/:id/pay", payBillController);

export default billRouter;