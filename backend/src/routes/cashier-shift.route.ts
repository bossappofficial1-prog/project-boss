import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { cashierShiftController } from "../controller/cashier-shift.controller";
import {
  closeCashierShiftSchema,
  createCashMovementSchema,
  openCashierShiftSchema,
} from "../schemas/cashier-shift.schema";
import { UserRole, StaffRole } from "@prisma/client";

const cashierShiftRouter = Router();

cashierShiftRouter.use(protect);

// Cashier-only endpoints (enforced in controller via storedUser.userType === "CASHIER")
cashierShiftRouter.get("/active", authorize(StaffRole.CASHIER, StaffRole.MANAGER), cashierShiftController.getActive);
cashierShiftRouter.post("/open", authorize(StaffRole.CASHIER, StaffRole.MANAGER), validateSchema(openCashierShiftSchema), cashierShiftController.open);
cashierShiftRouter.post("/:shiftId/close", authorize(StaffRole.CASHIER, StaffRole.MANAGER), validateSchema(closeCashierShiftSchema), cashierShiftController.close);
cashierShiftRouter.post(
  "/:shiftId/movements",
  authorize(StaffRole.CASHIER, StaffRole.MANAGER),
  validateSchema(createCashMovementSchema),
  cashierShiftController.createMovement,
);

// Owner endpoint for reporting
cashierShiftRouter.get("/", authorize(UserRole.OWNER), cashierShiftController.listForOwner);

export default cashierShiftRouter;
