import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { NotificationMonitoringService } from "../service/notification-monitoring.service";
import { NotificationRecoveryService } from "../service/notification-recovery.service";

/**
 * Queue monitoring and troubleshooting controller
 */
export class QueueMonitoringController {
    
    /**
     * Get health status of all notification queues
     */
    static getQueueHealth = asyncHandler(async (req: Request, res: Response) => {
        const healthStatus = await NotificationMonitoringService.getQueueHealthStatus();
        return ResponseUtil.success(res, healthStatus);
    });
    
    /**
     * Get detailed information about a specific queue
     */
    static getQueueInfo = asyncHandler(async (req: Request, res: Response) => {
        const { queueName } = req.params;
        const queueInfo = await NotificationMonitoringService.getDetailedQueueInfo(queueName);
        return ResponseUtil.success(res, queueInfo);
    });
    
    /**
     * Emergency recovery for notification system
     */
    static recoverNotificationSystem = asyncHandler(async (req: Request, res: Response) => {
        const result = await NotificationRecoveryService.recoverNotificationSystem();
        return ResponseUtil.success(res, result);
    });
    
    /**
     * Setup/repair queue configuration
     */
    static setupQueues = asyncHandler(async (req: Request, res: Response) => {
        const result = await NotificationRecoveryService.setupQueues();
        return ResponseUtil.success(res, result);
    });
    
    /**
     * Purge dead letter queue
     */
    static purgeDLQ = asyncHandler(async (req: Request, res: Response) => {
        const { queueName = 'notification_dlq' } = req.body;
        const result = await NotificationMonitoringService.purgeDLQ(queueName);
        return ResponseUtil.success(res, result);
    });
    
    /**
     * Requeue messages from DLQ back to main queue
     */
    static requeueFromDLQ = asyncHandler(async (req: Request, res: Response) => {
        const { dlqName = 'notification_dlq', targetQueue = 'notification_queue' } = req.body;
        const result = await NotificationMonitoringService.requeueFromDLQ(dlqName, targetQueue);
        return ResponseUtil.success(res, result);
    });
    
    /**
     * Test notification publishing
     */
    static testNotification = asyncHandler(async (req: Request, res: Response) => {
        const result = await NotificationMonitoringService.testNotificationPublish();
        return ResponseUtil.success(res, result);
    });
    
    /**
     * Get diagnostic information for notification issues
     */
    static getDiagnostics = asyncHandler(async (req: Request, res: Response) => {
        const healthStatus = await NotificationMonitoringService.getQueueHealthStatus();
        
        const diagnostics = {
            timestamp: new Date().toISOString(),
            systemStatus: healthStatus,
            commonIssues: [
                {
                    issue: "NotificationWorker failing to process messages",
                    possibleCauses: [
                        "Worker process is not running",
                        "Database connection issues in worker",
                        "Invalid message format",
                        "Missing environment variables in worker",
                        "Socket.IO connection issues"
                    ],
                    solutions: [
                        "Check if worker process is running",
                        "Verify worker database connection",
                        "Check worker logs for specific errors",
                        "Restart worker process",
                        "Clear DLQ and requeue messages"
                    ]
                },
                {
                    issue: "Messages going to Dead Letter Queue",
                    possibleCauses: [
                        "Worker consuming but failing to process",
                        "Message format incompatibility",
                        "External service dependencies failing"
                    ],
                    solutions: [
                        "Use /requeue-dlq endpoint to retry messages",
                        "Fix root cause before requeuing",
                        "Use /purge-dlq if messages are corrupted"
                    ]
                }
            ],
            troubleshootingSteps: [
                "1. Check queue health with /queue-health",
                "2. Test message publishing with /test-notification", 
                "3. Check specific queue with /queue-info/:queueName",
                "4. If DLQ has messages, investigate and fix root cause",
                "5. Requeue DLQ messages with /requeue-dlq",
                "6. Monitor system after fixes"
            ]
        };
        
        return ResponseUtil.success(res, diagnostics);
    });
}
