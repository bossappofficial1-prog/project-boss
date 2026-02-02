import { Router } from "express";
import { subscriptionPlanController } from "../controller/subscription-plan.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { subscriptionPlanSchema, subscriptionPlanUpdateSchema } from "../schemas/subscription-plan.schema";

const subscriptionPlanRouter = Router()

subscriptionPlanRouter.get('/', subscriptionPlanController.getAll)

subscriptionPlanRouter.use(
    protect,
    authorize("ADMIN"))

subscriptionPlanRouter.put(
    '/:subscriptionPlanId',
    validateSchema(subscriptionPlanSchema),
    subscriptionPlanController.update
)

subscriptionPlanRouter.post('/',
    validateSchema(subscriptionPlanUpdateSchema),
    subscriptionPlanController.create
)

subscriptionPlanRouter.delete(
    '/:subscriptionPlanId',
    subscriptionPlanController.delete)

export default subscriptionPlanRouter