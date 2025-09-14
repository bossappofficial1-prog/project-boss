import { getRabbitMQChannel } from '../config/rabbitmq';
import logger from '../utils/winston.logger';
import { messagePublisher } from './message-publisher.service';

export class NotificationMonitoringService {

    /**
     * Check queue health and get statistics
     */
    static async getQueueHealthStatus() {
        try {
            const channel = getRabbitMQChannel();

            // Check common notification queues
            const queueNames = [
                'notification_queue',
                'notification_dlq',
                'email_queue',
                'order_notification_queue'
            ];

            const queueStats: any = {};

            for (const queueName of queueNames) {
                try {
                    const info = await channel.checkQueue(queueName);
                    queueStats[queueName] = {
                        messageCount: info.messageCount,
                        consumerCount: info.consumerCount,
                        status: 'healthy'
                    };

                    // Log warning if queue has too many messages
                    if (info.messageCount > 100) {
                        logger.warn(`[QUEUE WARNING] ${queueName} has ${info.messageCount} pending messages`);
                    }

                } catch (queueError: any) {
                    queueStats[queueName] = {
                        status: 'error',
                        error: queueError.message
                    };
                }
            }

            return {
                timestamp: new Date().toISOString(),
                rabbitMQStatus: 'connected',
                queues: queueStats
            };

        } catch (error: any) {
            logger.error('[QUEUE HEALTH CHECK] Failed to get queue status', error);
            return {
                timestamp: new Date().toISOString(),
                rabbitMQStatus: 'error',
                error: error.message
            };
        }
    }

    /**
     * Purge dead letter queue
     */
    static async purgeDLQ(queueName: string = 'notification_dlq') {
        try {
            const channel = getRabbitMQChannel();
            const purgeResult = await channel.purgeQueue(queueName);

            logger.info(`[DLQ PURGE] Purged ${purgeResult.messageCount} messages from ${queueName}`);

            return {
                success: true,
                purgedCount: purgeResult.messageCount,
                queueName
            };

        } catch (error) {
            logger.error(`[DLQ PURGE] Failed to purge ${queueName}`, error);
            throw error;
        }
    }

    /**
     * Re-queue messages from DLQ back to main queue
     */
    static async requeueFromDLQ(dlqName: string = 'notification_dlq', targetQueue: string = 'notification_queue') {
        try {
            const channel = getRabbitMQChannel();
            let requeuedCount = 0;

            // Consume messages from DLQ and republish to main queue
            const consumePromise = new Promise<number>((resolve, reject) => {
                channel.consume(dlqName, async (msg) => {
                    if (msg) {
                        try {
                            // Parse message to validate it
                            const messageContent = JSON.parse(msg.content.toString());

                            // Add requeue metadata
                            const requeuedMessage = {
                                ...messageContent,
                                requeued: true,
                                requeuedAt: new Date().toISOString(),
                                originalFailureCount: msg.properties.headers?.['x-death']?.[0]?.count || 0
                            };

                            // Republish to target queue
                            await channel.sendToQueue(
                                targetQueue,
                                Buffer.from(JSON.stringify(requeuedMessage)),
                                { persistent: true }
                            );

                            // Acknowledge the DLQ message
                            channel.ack(msg);
                            requeuedCount++;

                            logger.info(`[REQUEUE] Message ${messageContent.id || 'unknown'} requeued from ${dlqName} to ${targetQueue}`);

                        } catch (parseError) {
                            logger.error('[REQUEUE] Failed to parse message from DLQ', parseError);
                            // Reject and don't requeue corrupted messages
                            channel.nack(msg, false, false);
                        }
                    } else {
                        // No more messages in DLQ
                        resolve(requeuedCount);
                    }
                }, { noAck: false });

                // Set timeout to avoid hanging
                setTimeout(() => {
                    resolve(requeuedCount);
                }, 5000);
            });

            const finalCount = await consumePromise;

            return {
                success: true,
                requeuedCount: finalCount,
                fromQueue: dlqName,
                toQueue: targetQueue
            };

        } catch (error) {
            logger.error(`[REQUEUE] Failed to requeue from ${dlqName} to ${targetQueue}`, error);
            throw error;
        }
    }

    /**
     * Test notification publishing
     */
    static async testNotificationPublish() {
        try {

            // Send test notification
            await messagePublisher.publishOrderStatusUpdate('TEST_ORDER_ID', 'TEST_STATUS');

            logger.info('[TEST] Test notification message published successfully');

            return {
                success: true,
                message: 'Test notification published'
            };

        } catch (error) {
            logger.error('[TEST] Failed to publish test notification', error);
            throw error;
        }
    }

    /**
     * Get detailed queue information
     */
    static async getDetailedQueueInfo(queueName: string) {
        try {
            const channel = getRabbitMQChannel();
            const queueInfo = await channel.checkQueue(queueName);

            return {
                queueName,
                messageCount: queueInfo.messageCount,
                consumerCount: queueInfo.consumerCount,
                status: queueInfo.messageCount > 0 ? 'has_messages' : 'empty',
                health: queueInfo.consumerCount > 0 ? 'active_consumers' : 'no_consumers'
            };

        } catch (error: any) {
            logger.error(`[QUEUE INFO] Failed to get info for ${queueName}`, error);
            return {
                queueName,
                status: 'error',
                error: error.message
            };
        }
    }
}

// Export singleton instance
export const notificationMonitoring = new NotificationMonitoringService();
