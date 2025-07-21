import { Router } from "express";
import {
    createOutletController,
    deleteOutletController,
    getAllOutletsController,
    getOutletByIdController,
    getOutletsByBusinessIdController,
    getFeaturedOutletsController,
    updateOutletController
} from "../controller/outlet.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createOutletSchema, updateOutletSchema } from "../schemas/outlet.schema";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const outletRouter = Router();

// Rute Publik
outletRouter.get("/", getAllOutletsController);
outletRouter.get("/featured", getFeaturedOutletsController);
outletRouter.get("/:id", getOutletByIdController);
outletRouter.get("/business/:businessId", getOutletsByBusinessIdController);

// Rute yang dilindungi dan hanya untuk Owner
outletRouter.post("/", protect, authorize(UserRole.OWNER), validateSchema(createOutletSchema), createOutletController);
outletRouter.patch("/:id", protect, authorize(UserRole.OWNER), validateSchema(updateOutletSchema), updateOutletController);
outletRouter.delete("/:id", protect, authorize(UserRole.OWNER), deleteOutletController);

export default outletRouter;