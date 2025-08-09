import { Router } from "express";
import { QueueMonitoringController } from "../controller/queue-monitoring.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const queueMonitoringRouter = Router();

// Protect all queue monitoring routes - only for admin/owner
queueMonitoringRouter.use(protect);
queueMonitoringRouter.use(authorize(UserRole.OWNER));

// Queue health and diagnostics
queueMonitoringRouter.get("/health", QueueMonitoringController.getQueueHealth);
queueMonitoringRouter.get("/diagnostics", QueueMonitoringController.getDiagnostics);
queueMonitoringRouter.get("/queue-info/:queueName", QueueMonitoringController.getQueueInfo);

// Emergency recovery operations
queueMonitoringRouter.post("/recover", QueueMonitoringController.recoverNotificationSystem);
queueMonitoringRouter.post("/setup-queues", QueueMonitoringController.setupQueues);

// Queue management operations
queueMonitoringRouter.post("/purge-dlq", QueueMonitoringController.purgeDLQ);
queueMonitoringRouter.post("/requeue-dlq", QueueMonitoringController.requeueFromDLQ);
queueMonitoringRouter.post("/test-notification", QueueMonitoringController.testNotification);

export default queueMonitoringRouter;
