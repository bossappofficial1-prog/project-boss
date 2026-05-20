import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { attendanceController } from "../controller/attendance.controller";
import { clockInSchema, clockOutSchema } from "../schemas/attendance.schema";
import { UserRole } from "@prisma/client";

const attendanceRouter = Router();

attendanceRouter.use(protect);

// Cashier-only
attendanceRouter.post("/clock-in", validateSchema(clockInSchema), attendanceController.clockIn);
attendanceRouter.post("/:id/clock-out", validateSchema(clockOutSchema), attendanceController.clockOut);
attendanceRouter.get("/me", attendanceController.me);
attendanceRouter.get("/today", attendanceController.today);

// Owner-only
attendanceRouter.get("/", authorize(UserRole.OWNER), attendanceController.listForOwner);

export default attendanceRouter;
