import { Router } from "express";
import {
    createBusinessController,
    getAllBusinessesController,
    getBusinessByIdController,
    getMyBusinessController,
    updateBusinessController,
    updateBankAccountController
} from "../controller/business.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createBusinessSchema, updateBusinessSchema } from "../schemas/business.schema";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const businessRouter = Router();

// Rute Publik
businessRouter.get("/", getAllBusinessesController);
businessRouter.get("/:id", getBusinessByIdController);

// Rute yang dilindungi dan hanya untuk Owner
businessRouter.post("/", protect, authorize(UserRole.OWNER), validateSchema(createBusinessSchema), createBusinessController);
businessRouter.get("/my/business", protect, authorize(UserRole.OWNER), getMyBusinessController);
businessRouter.patch("/:id", protect, authorize(UserRole.OWNER), validateSchema(updateBusinessSchema), updateBusinessController);
businessRouter.put('/:id/bank-account', protect, updateBankAccountController);

export default businessRouter;