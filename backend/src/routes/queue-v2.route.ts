import { Router } from "express";
import { protect, authorizeOwnerOrCashier } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { transitionQueueStatusSchema, rescheduleQueueSchema } from "../schemas/queue-v2.schema";
import { queueV2GetBoard, queueV2TransitionStatus, queueV2Reschedule } from "../controller/queue-v2.controller";

const queueV2Router = Router();

queueV2Router.use(protect, authorizeOwnerOrCashier);

queueV2Router.get("/:outletId/board", queueV2GetBoard);
queueV2Router.patch("/:id/transition", validateSchema(transitionQueueStatusSchema), queueV2TransitionStatus);
queueV2Router.patch("/:id/reschedule", validateSchema(rescheduleQueueSchema), queueV2Reschedule);

export default queueV2Router;
