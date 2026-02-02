import { asyncHandler } from "../middleware/error.middleware";
import { Request, Response } from 'express'
import { ResponseUtil } from "../utils";
import { SubscriptionPlanService } from "../service/subscription-plan.service";
import { HttpStatus } from "../constants/http-status";
import { SubscriptionPlanInput, UpdateSubscriptionPlanInput } from "../schemas/subscription-plan.schema";

class SubscriptionPlanController {
    public getAll = asyncHandler(async (req: Request, res: Response) => {
        const subscriptionPlans = await SubscriptionPlanService.getAll()
        return ResponseUtil.success(res, subscriptionPlans, HttpStatus.OK)
    })

    public create = asyncHandler(async (req: Request, res: Response) => {
        const data = req.body as SubscriptionPlanInput
        const subscriptionPlan = await SubscriptionPlanService.create(data)

        return ResponseUtil.success(res, subscriptionPlan, HttpStatus.CREATED)
    })

    public update = asyncHandler(async (req: Request, res: Response) => {
        const subscriptionPlanId = req.params.subscriptionPlanId as string
        const data = req.body as UpdateSubscriptionPlanInput
        const subscriptionPlan = await SubscriptionPlanService.update(subscriptionPlanId, data)

        return ResponseUtil.success(res, subscriptionPlan, HttpStatus.OK)
    })

    public delete = asyncHandler(async (req: Request, res: Response) => {
        const subscriptionPlanId = req.params.subscriptionPlanId as string
        const subscriptionPlan = await SubscriptionPlanService.delete(subscriptionPlanId)

        return ResponseUtil.success(res, subscriptionPlan, HttpStatus.OK)
    })
}

export const subscriptionPlanController = new SubscriptionPlanController()