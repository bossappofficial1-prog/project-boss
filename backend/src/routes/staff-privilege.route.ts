import { Router } from "express";
import {
  getStaffPrivilegesController,
  assignPrivilegesController,
  removePrivilegeController,
} from "../controller/staff-privilege.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const staffPrivilegeRouter = Router({ mergeParams: true });

// GET    /api/staff/:id/privileges
staffPrivilegeRouter.get(
  "/",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  getStaffPrivilegesController,
);

// POST   /api/staff/:id/privileges
staffPrivilegeRouter.post(
  "/",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  assignPrivilegesController,
);

// DELETE /api/staff/:id/privileges/:type
staffPrivilegeRouter.delete(
  "/:type",
  protect,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  removePrivilegeController,
);

export default staffPrivilegeRouter;
