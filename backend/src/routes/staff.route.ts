import { Router } from "express";
import { validateSchema } from "../middleware/zod.middleware";
import { staffSchema, updateStaffSchema } from "../schemas/staff.schema";
import {
  createStaffController,
  deleteStaffController,
  getStaffByIdController,
  getStaffByOutletController,
  updateStaffController,
} from "../controller/staff.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { requireActiveSubscription } from "../middleware/subscription.middleware";
import staffPrivilegeRouter from "./staff-privilege.route";

const staffRouter = Router();

// Semua rute di bawah ini dilindungi dan hanya untuk Owner
staffRouter.use(protect, authorize(UserRole.OWNER, "MANAGER"));

staffRouter.post(
  "/",
  requireActiveSubscription,
  validateSchema(staffSchema),
  createStaffController,
);
staffRouter.get(
  "/outlet/:outletId",
  requireActiveSubscription,
  getStaffByOutletController,
);
staffRouter.get("/:id", requireActiveSubscription, getStaffByIdController);
staffRouter.patch(
  "/:id",
  requireActiveSubscription,
  validateSchema(updateStaffSchema),
  updateStaffController,
);
staffRouter.delete("/:id", requireActiveSubscription, deleteStaffController);

// Privilege routes — nested: /staff/:id/privileges
staffRouter.use("/:id/privileges", staffPrivilegeRouter);

export default staffRouter;
