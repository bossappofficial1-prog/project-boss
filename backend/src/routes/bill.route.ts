import { Router } from "express";
import { protect, authorizeOwnerOrCashier } from "../middleware/auth.middleware";
import { createBillController, getBillByIdController, listBillsController, payBillController } from "../controller/bill.controller";

const billRouter = Router();

billRouter.use(protect, authorizeOwnerOrCashier);
billRouter.post("/", createBillController);
billRouter.get("/", listBillsController);
billRouter.get("/:id", getBillByIdController);
billRouter.put("/:id/pay", payBillController);

export default billRouter;