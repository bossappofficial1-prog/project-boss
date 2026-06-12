import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { attendanceController } from "../controller/attendance.controller";
import {
  clockInSchema,
  clockOutSchema,
  portalClockSchema,
  verifyPinSchema,
} from "../schemas/attendance.schema";
import { StaffRole } from "@prisma/client";
import { authorizeOwnerOrManagerPrivilege } from "../middleware/privilege.middleware";
import { StaffPrivilegeType } from "@prisma/client";

const attendanceRouter = Router();

// Public kiosk portal endpoints (authenticated via PIN)
attendanceRouter.post(
  "/portal/verify-pin",
  validateSchema(verifyPinSchema),
  attendanceController.verifyPin,
);

attendanceRouter.post(
  "/portal/clock",
  validateSchema(portalClockSchema),
  attendanceController.portalClock,
);

attendanceRouter.use(protect);

// Cashier-only
attendanceRouter.post(
  "/clock-in",
  authorize(StaffRole.CASHIER, StaffRole.MANAGER),
  validateSchema(clockInSchema),
  attendanceController.clockIn,
);
attendanceRouter.post(
  "/:id/clock-out",
  authorize(StaffRole.CASHIER, StaffRole.MANAGER),
  validateSchema(clockOutSchema),
  attendanceController.clockOut,
);
attendanceRouter.get(
  "/me",
  authorize(StaffRole.CASHIER, StaffRole.MANAGER),
  attendanceController.me,
);
attendanceRouter.get(
  "/today",
  authorize(StaffRole.CASHIER, StaffRole.MANAGER),
  attendanceController.today,
);

attendanceRouter.get(
  "/",
  authorizeOwnerOrManagerPrivilege(StaffPrivilegeType.ATTENDANCE_MANAGEMENT),
  attendanceController.listForOwner,
);

attendanceRouter.get(
  "/export",
  authorizeOwnerOrManagerPrivilege(StaffPrivilegeType.ATTENDANCE_MANAGEMENT),
  attendanceController.exportAttendance,
);

attendanceRouter.post(
  "/manage",
  authorizeOwnerOrManagerPrivilege(StaffPrivilegeType.ATTENDANCE_MANAGEMENT),
  attendanceController.createManual,
);

attendanceRouter.put(
  "/manage/:id",
  authorizeOwnerOrManagerPrivilege(StaffPrivilegeType.ATTENDANCE_MANAGEMENT),
  attendanceController.updateManual,
);

attendanceRouter.delete(
  "/manage/:id",
  authorizeOwnerOrManagerPrivilege(StaffPrivilegeType.ATTENDANCE_MANAGEMENT),
  attendanceController.deleteManual,
);

export default attendanceRouter;
