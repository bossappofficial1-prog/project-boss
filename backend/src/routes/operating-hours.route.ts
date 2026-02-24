import { Router } from "express";
import { validateSchema } from "../middleware/zod.middleware";
import { createOperatingHoursSchema, updateOperatingHoursSchema } from "../schemas/operating-hours.schema";
import {
    // createOperatingHoursController,
    getOperatingHoursByOutletController,
    updateOperatingHoursController,
    upsertOperatingHoursController
} from "../controller/operating-hours.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const operatingHoursRouter = Router();

// Rute publik untuk melihat jam operasional
operatingHoursRouter.get("/outlet/:outletId", getOperatingHoursByOutletController);

// Semua rute di bawah ini dilindungi dan hanya untuk Owner
operatingHoursRouter.use(protect, authorize(UserRole.OWNER));

// operatingHoursRouter.post("/", validateSchema(createOperatingHoursSchema), createOperatingHoursController);
operatingHoursRouter.put("/:outletId/upsert", validateSchema(createOperatingHoursSchema), upsertOperatingHoursController);
operatingHoursRouter.patch("/:id", validateSchema(updateOperatingHoursSchema), updateOperatingHoursController);

export default operatingHoursRouter;
