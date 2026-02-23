import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import { requireActiveSubscription } from "../middleware/subscription.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { UserRole } from "@prisma/client";
import {
  createMemberController,
  deleteMemberController,
  getMemberByIdController,
  getMembersByOutletController,
  increasePointController,
  updateMemberController,
} from "../controller/member.controller";
import {
  createMemberSchema,
  increasePointSchema,
  updateMemberSchema,
} from "../schemas/member.schema";

const memberRouter = Router();

memberRouter.use(protect, authorize(UserRole.OWNER));

memberRouter.post(
  "/",
  requireActiveSubscription,
  validateSchema(createMemberSchema),
  createMemberController,
);

memberRouter.get("/outlet/:outletId", requireActiveSubscription, getMembersByOutletController);

memberRouter.get("/:id", requireActiveSubscription, getMemberByIdController);

memberRouter.patch(
  "/:id",
  requireActiveSubscription,
  validateSchema(updateMemberSchema),
  updateMemberController,
);

memberRouter.post(
  "/:id/increase-point",
  requireActiveSubscription,
  validateSchema(increasePointSchema),
  increasePointController,
);

memberRouter.delete("/:id", requireActiveSubscription, deleteMemberController);

export default memberRouter;
