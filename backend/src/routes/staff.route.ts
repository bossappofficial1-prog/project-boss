import { Router } from "express";
import { validateSchema } from "../middleware/zod.middleware";
import { createStaffSchema, updateStaffSchema } from "../schemas/staff.schema";
import {
    createStaffController,
    deleteStaffController,
    getStaffByIdController,
    getStaffByOutletController,
    updateStaffController
} from "../controller/staff.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const staffRouter = Router();

// Semua rute di bawah ini dilindungi dan hanya untuk Owner
staffRouter.use(protect, authorize(UserRole.OWNER));

staffRouter.post("/", validateSchema(createStaffSchema), createStaffController);
staffRouter.get("/outlet/:outletId", getStaffByOutletController);
staffRouter.get("/:id", getStaffByIdController);
staffRouter.patch("/:id", validateSchema(updateStaffSchema), updateStaffController);
staffRouter.delete("/:id", deleteStaffController);

export default staffRouter;
