import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { cashierShiftController } from "../controller/cashier-shift.controller";
import {
  closeCashierShiftSchema,
  createCashMovementSchema,
  openCashierShiftSchema,
} from "../schemas/cashier-shift.schema";
import { UserRole } from "@prisma/client";

const cashierShiftRouter = Router();

cashierShiftRouter.use(protect);

// Cashier-only endpoints (enforced in controller via storedUser.userType === "CASHIER")
cashierShiftRouter.get("/active", cashierShiftController.getActive);
cashierShiftRouter.post("/open", validateSchema(openCashierShiftSchema), cashierShiftController.open);
cashierShiftRouter.post("/:shiftId/close", validateSchema(closeCashierShiftSchema), cashierShiftController.close);
cashierShiftRouter.post(
  "/:shiftId/movements",
  validateSchema(createCashMovementSchema),
  cashierShiftController.createMovement,
);

// Owner endpoint for reporting
cashierShiftRouter.get("/", authorize(UserRole.OWNER), cashierShiftController.listForOwner);

export default cashierShiftRouter;
