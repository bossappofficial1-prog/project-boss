import { Router } from "express";
import { validateSchema } from "../middleware/zod.middleware";
import { staffSchema, updateStaffSchema } from "../schemas/staff.schema";
import {
    createStaffController,
    deleteStaffController,
    getStaffByIdController,
    getStaffByOutletController,
    updateStaffController
} from "../controller/staff.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { checkStaffLimit } from "../middleware/subscription-limits.middleware";

const staffRouter = Router();

// Semua rute di bawah ini dilindungi dan hanya untuk Owner
staffRouter.use(protect, authorize(UserRole.OWNER));

staffRouter.post("/", checkStaffLimit, validateSchema(staffSchema), createStaffController);
staffRouter.get("/outlet/:outletId", getStaffByOutletController);
staffRouter.get("/:id", getStaffByIdController);
staffRouter.patch("/:id", validateSchema(updateStaffSchema), updateStaffController);
staffRouter.delete("/:id", deleteStaffController);

export default staffRouter;
