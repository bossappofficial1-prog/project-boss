import { getRabbitMQChannel } from '../config/rabbitmq';
import { NotificationMonitoringService } from '../service/notification-monitoring.service';
import logger from '../utils/pino.logger';

/**
 * Emergency notification system recovery script
 */
export class NotificationRecoveryService {
    
    /**
     * Setup proper queue configuration with DLQ
     */
    static async setupQueues() {
        try {
            const channel = getRabbitMQChannel();
            
            // Define exchanges
            const exchanges = [
                { name: 'notification_exchange', type: 'fanout' },
                { name: 'email_exchange', type: 'fanout' },
                { name: 'service_order_exchange', type: 'fanout' },
                { name: 'payment_webhook_exchange', type: 'fanout' }
            ];
            
            // Create exchanges
            for (const exchange of exchanges) {
                await channel.assertExchange(exchange.name, exchange.type, { durable: true });
                logger.info(`[SETUP] Exchange ${exchange.name} created/verified`);
            }
            
            // Define queues with DLQ configuration
            const queueConfigs = [
                {
                    name: 'notification_queue',
                    dlq: 'notification_dlq',
                    exchange: 'notification_exchange'
                },
                {
                    name: 'email_queue', 
                    dlq: 'email_dlq',
                    exchange: 'email_exchange'
                },
                {
                    name: 'service_order_queue',
                    dlq: 'service_order_dlq', 
                    exchange: 'service_order_exchange'
                },
                {
                    name: 'payment_webhook_queue',
                    dlq: 'payment_webhook_dlq',
                    exchange: 'payment_webhook_exchange'
                }
            ];
            
            // Create queues with DLQ setup
            for (const config of queueConfigs) {
                // Create DLQ first
                await channel.assertQueue(config.dlq, {
                    durable: true,
                    arguments: {
                        'x-message-ttl': 24 * 60 * 60 * 1000, // 24 hours TTL
                    }
                });
                
                // Create main queue with DLQ configuration
                await channel.assertQueue(config.name, {
                    durable: true,
                    arguments: {
                        'x-dead-letter-exchange': '',
                        'x-dead-letter-routing-key': config.dlq,
                        'x-max-retries': 5
                    }
                });
                
                // Bind queue to exchange
                await channel.bindQueue(config.name, config.exchange, '');
                
                logger.info(`[SETUP] Queue ${config.name} with DLQ ${config.dlq} created/verified`);
            }
            
            return {
                success: true,
                message: 'All queues and exchanges setup successfully'
            };
            
        } catch (error) {
            logger.error('[SETUP] Failed to setup queues', error);
            throw error;
        }
    }
    
    /**
     * Recover failed notification processing
     */
    static async recoverNotificationSystem() {
        try {
            logger.info('[RECOVERY] Starting notification system recovery...');
            
            // 1. Setup queues if not exists
            await this.setupQueues();
            
            // 2. Check current queue health
            const healthStatus = await NotificationMonitoringService.getQueueHealthStatus();
            logger.info('[RECOVERY] Current queue health:', healthStatus);
            
            // 3. Handle DLQ messages
            const dlqQueues = ['notification_dlq', 'email_dlq', 'service_order_dlq'];
            
            for (const dlqName of dlqQueues) {
                try {
                    const dlqInfo = await NotificationMonitoringService.getDetailedQueueInfo(dlqName);
                    
                    if (dlqInfo.messageCount && dlqInfo.messageCount > 0) {
                        logger.warn(`[RECOVERY] Found ${dlqInfo.messageCount} messages in ${dlqName}`);
                        
                        // Option 1: Purge old messages (older than 1 hour)
                        // Option 2: Requeue them (if you want to retry)
                        
                        // For now, let's log them for manual decision
                        logger.info(`[RECOVERY] DLQ ${dlqName} has ${dlqInfo.messageCount} messages. Use /api/queue-monitoring/requeue-dlq to retry or /api/queue-monitoring/purge-dlq to clear`);
                    }
                    
                } catch (dlqError) {
                    logger.error(`[RECOVERY] Failed to check DLQ ${dlqName}`, dlqError);
                }
            }
            
            // 4. Test notification publishing
            try {
                await NotificationMonitoringService.testNotificationPublish();
                logger.info('[RECOVERY] Test notification published successfully');
            } catch (testError) {
                logger.error('[RECOVERY] Test notification failed', testError);
            }
            
            logger.info('[RECOVERY] Notification system recovery completed');
            
            return {
                success: true,
                message: 'Notification system recovery completed',
                healthStatus
            };
            
        } catch (error) {
            logger.error('[RECOVERY] Failed to recover notification system', error);
            throw error;
        }
    }
    
    /**
     * Create robust message publisher with retry logic
     */
    static async publishWithRetry(exchangeName: string, message: any, maxRetries: number = 3) {
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                const channel = getRabbitMQChannel();
                
                const messageWithMetadata = {
                    ...message,
                    timestamp: new Date().toISOString(),
                    id: `${message.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    attempt: attempt + 1,
                    maxRetries
                };
                
                const published = channel.publish(
                    exchangeName,
                    '',
                    Buffer.from(JSON.stringify(messageWithMetadata)),
                    { 
                        persistent: true,
                        headers: {
                            'x-retry-count': attempt,
                            'x-first-attempt-time': new Date().toISOString()
                        }
                    }
                );
                
                if (published) {
                    logger.info(`[PUBLISH] Message published successfully on attempt ${attempt + 1}`, {
                        exchange: exchangeName,
                        messageType: message.type,
                        messageId: messageWithMetadata.id
                    });
                    return messageWithMetadata;
                } else {
                    throw new Error('Publish returned false - buffer full');
                }
                
            } catch (error) {
                attempt++;
                logger.warn(`[PUBLISH] Attempt ${attempt} failed for ${exchangeName}`, error);
                
                if (attempt >= maxRetries) {
                    logger.error(`[PUBLISH] All ${maxRetries} attempts failed for ${exchangeName}`, error);
                    throw error;
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
}
