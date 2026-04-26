import { Router } from "express";
import {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable,
} from "../controller/table.controller";
import { createTableSchema, updateTableSchema } from "../schemas/table.schema";
import { protect, authorize, authorizeOwnerOrCashier } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// Public/Cashier/Owner can get tables
router.get("/", protect, authorizeOwnerOrCashier, getTables);
router.get("/:id", protect, authorizeOwnerOrCashier, getTableById);

// Only Owner/Admin can manage tables
router.post("/", protect, authorize(UserRole.OWNER, UserRole.ADMIN), validateSchema(createTableSchema), createTable);
router.patch("/:id", protect, authorize(UserRole.OWNER, UserRole.ADMIN), validateSchema(updateTableSchema), updateTable);
router.delete("/:id", protect, authorize(UserRole.OWNER, UserRole.ADMIN), deleteTable);

export default router;
