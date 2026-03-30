import { Request, Response } from "express"
import { asyncHandler } from "../middleware/error.middleware";
import { PushNotificationService } from "../service/push-notification.service";
import { ResponseUtil } from "../utils";
import { PushSubscriptionPayload } from "../schemas/push-notification.schema";

export class PushNotificationController {
    constructor(private readonly service: PushNotificationService) { }

    public subscribe = asyncHandler(async (req: Request<PushSubscriptionPayload>, res: Response) => {
        const result = await this.service.subscribe(req.body)
        return ResponseUtil.success(res, result)
    })
    public unsubscribe = asyncHandler(async (req: Request, res: Response) => {
        const result = await this.service.unsubscribe(req.body.endpoint)

        return ResponseUtil.success(res, result)
    })
}