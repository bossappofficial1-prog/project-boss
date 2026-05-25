// @ts-nocheck
import { Router } from "express";
import { createPublicOrder, getPublicOutletMenu } from "../controller/public.controller";
import { asyncHandler } from "../middleware/error.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { getPublicTableContextSchema } from "../schemas/table.schema";
import { PublicTableController } from "../controller/public-table.controller";

const publicRouter = Router();

publicRouter.get("/outlets/:slug/menu", getPublicOutletMenu);
publicRouter.post("/orders", createPublicOrder);
publicRouter.get(
    "/tables/:tableId/context",
    validateSchema(getPublicTableContextSchema),
    asyncHandler(PublicTableController.getQrTableContext)
);

export default publicRouter;
