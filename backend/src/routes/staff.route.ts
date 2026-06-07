import { Router } from "express";
import { validateSchema } from "../middleware/zod.middleware";
import { staffSchema, updateStaffSchema } from "../schemas/staff.schema";
import {
  createStaffController,
  deleteStaffController,
  getStaffByIdController,
  getStaffByOutletController,
  updateStaffController,
  downloadStaffImportTemplateController,
  importStaffController,
} from "../controller/staff.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { requireActiveSubscription } from "../middleware/subscription.middleware";
import staffPrivilegeRouter from "./staff-privilege.route";

const staffRouter = Router();

staffRouter.get("/outlet/:outletId", getStaffByOutletController);

// Semua rute di bawah ini dilindungi dan hanya untuk Owner/Manager
staffRouter.use(protect, authorize(UserRole.OWNER, "MANAGER"));

// Import/Export routes (before :id to avoid conflict)
staffRouter.get(
  "/import/template",
  requireActiveSubscription,
  downloadStaffImportTemplateController,
);

staffRouter.post("/import", requireActiveSubscription, importStaffController);

staffRouter.post(
  "/",
  requireActiveSubscription,
  validateSchema(staffSchema),
  createStaffController,
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
