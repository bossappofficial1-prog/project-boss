import { Router } from "express";
import { PushNotificationController } from "../controller/push-notification.controller";
import { PushNotificationService } from "../service/push-notification.service";
import { PushNotificationRepository } from "../repositories/push-notification.repository";
import { validateSchema } from "../middleware/zod.middleware";
import { PushSubscriptionPayloadSchema } from "../schemas/push-notification.schema";

const pushNotification = Router()
const repo = new PushNotificationRepository()
const service = new PushNotificationService(repo)
const controller = new PushNotificationController(service)

pushNotification.post(
    '/subscribe',
    validateSchema(PushSubscriptionPayloadSchema),
    controller.subscribe)
pushNotification.post(
    '/unsubscribe',
    controller.unsubscribe)
pushNotification.get(
    '/vapid-key',
    controller.getVapidKey)

export default pushNotification