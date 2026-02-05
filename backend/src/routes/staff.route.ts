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
import { requireActiveSubscription } from "../middleware/subscription.middleware";

const staffRouter = Router();

// Semua rute di bawah ini dilindungi dan hanya untuk Owner
staffRouter.use(protect, authorize(UserRole.OWNER));

staffRouter.post("/", requireActiveSubscription, validateSchema(staffSchema), createStaffController);
staffRouter.get("/outlet/:outletId", requireActiveSubscription, getStaffByOutletController);
staffRouter.get("/:id", requireActiveSubscription, getStaffByIdController);
staffRouter.patch("/:id", requireActiveSubscription, validateSchema(updateStaffSchema), updateStaffController);
staffRouter.delete("/:id", requireActiveSubscription, deleteStaffController);

export default staffRouter;
