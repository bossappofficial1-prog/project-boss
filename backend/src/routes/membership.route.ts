import { Router } from "express";
import {
    createMembershipController,
    deleteMembershipController,
    getMembershipByIdController,
    getMembershipsByBusinessIdController,
    updateMembershipController
} from "../controller/membership.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createMembershipSchema, updateMembershipSchema } from "../schemas/membership.schema";

const membershipRouter = Router();

// Rute ini mungkin perlu diamankan agar hanya bisa diakses oleh Owner
membershipRouter.post("/", validateSchema(createMembershipSchema), createMembershipController);
membershipRouter.get("/:id", getMembershipByIdController);
membershipRouter.get("/business/:businessId", getMembershipsByBusinessIdController);
membershipRouter.patch("/:id", validateSchema(updateMembershipSchema), updateMembershipController);
membershipRouter.delete("/:id", deleteMembershipController);

export default membershipRouter;