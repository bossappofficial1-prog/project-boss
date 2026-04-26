import { Router } from "express";
import {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable,
} from "../controller/table.controller";
import { createTableSchema, updateTableSchema } from "../schemas/table.schema";
import { protect } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";

const router = Router();

// Public/Cashier/Owner can get tables
router.get("/", protect, getTables);
router.get("/:id", protect, getTableById);

// Only Owner/Admin can manage tables
router.post("/", protect, validateSchema(createTableSchema), createTable);
router.patch("/:id", protect, validateSchema(updateTableSchema), updateTable);
router.delete("/:id", protect, deleteTable);

export default router;
