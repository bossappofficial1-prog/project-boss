import { connectRabbitMQ, getRabbitMQChannel } from '../config/rabbitmq';
import { NotificationService } from '../service/notification.service';
import { getOrderByIdService } from '../service/order.service';
import { QUEUE_NAMES, OrderNotificationEvent } from '../service/message-publisher.service';
import logger from '../utils/winston.logger';

class NotificationWorker {
    private isRunning = false;

    async start() {
        if (this.isRunning) {
            logger.warn('⚠️ Notification worker already running', {
                event: 'worker_already_running',
                component: 'notification_worker'
            });
            return;
        }

        try {
            await connectRabbitMQ();
            const channel = getRabbitMQChannel();

            await channel.assertQueue(QUEUE_NAMES.NOTIFICATION, { durable: true });

            // Set prefetch untuk load balancing antar worker instances
            channel.prefetch(1);

            this.isRunning = true;

            logger.info('🚀 Notification worker started', {
                event: 'notification_worker_started',
                component: 'notification_worker',
                queue: QUEUE_NAMES.NOTIFICATION
            });

            channel.consume(QUEUE_NAMES.NOTIFICATION, async (msg) => {
                if (msg) {
                    await this.processMessage(msg, channel);
                }
            }, { noAck: false });

        } catch (error: any) {
            logger.error('❌ Failed to start notification worker', {
                error: error.message,
                stack: error.stack,
                event: 'worker_start_failed',
                component: 'notification_worker'
            });
            throw error;
        }
    }

    private async processMessage(msg: any, channel: any) {
        const startTime = Date.now();
        let messageData: any;

        try {
            messageData = JSON.parse(msg.content.toString());

            logger.info('📨 Processing notification message', {
                event: 'notification_processing',
                component: 'notification_worker',
                messageId: messageData.id,
                messageType: messageData.type,
                orderId: messageData.payload?.orderId
            });

            if (messageData.type === 'ORDER_STATUS_UPDATE') {
                await this.handleOrderStatusUpdate(messageData as OrderNotificationEvent);
            } else {
                logger.warn('⚠️ Unknown message type', {
                    event: 'unknown_message_type',
                    component: 'notification_worker',
                    messageType: messageData.type
                });
            }

            channel.ack(msg);

            logger.info('✅ Message processed successfully', {
                event: 'notification_processed',
                component: 'notification_worker',
                messageId: messageData.id,
                processingTime: Date.now() - startTime
            });

        } catch (error: any) {
            logger.error('❌ Failed to process notification message', {
                error: error.message,
                stack: error.stack,
                event: 'notification_processing_failed',
                component: 'notification_worker',
                messageId: messageData?.id,
                processingTime: Date.now() - startTime
            });

            // Reject message tanpa requeue jika sudah retry berkali-kali
            const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
            if (retryCount > 3) {
                logger.error('💀 Message max retries exceeded, sending to DLQ', {
                    event: 'message_max_retries',
                    component: 'notification_worker',
                    messageId: messageData?.id,
                    retryCount
                });
                channel.nack(msg, false, false); // Don't requeue
            } else {
                logger.warn('🔄 Retrying message', {
                    event: 'message_retry',
                    component: 'notification_worker',
                    messageId: messageData?.id,
                    retryCount
                });
                // Add retry count header and requeue
                msg.properties.headers = { ...msg.properties.headers, 'x-retry-count': retryCount };
                channel.nack(msg, false, true); // Requeue
            }
        }
    }

    private async handleOrderStatusUpdate(event: OrderNotificationEvent) {
        const { orderId, status } = event.payload;

        const order = await getOrderByIdService(orderId);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        let message = `Status pesanan Anda #${order.id} telah diperbarui menjadi ${status}.`;
        if (status === 'COMPLETED') {
            message = `Pesanan Anda #${order.id} telah selesai. Terima kasih!`;
        }

        await NotificationService.sendOrderStatusUpdate(
            order.guestCustomer.phone,
            orderId,
            order.orderStatus
        );
    }

    stop() {
        this.isRunning = false;
        logger.info('🛑 Notification worker stopped', {
            event: 'notification_worker_stopped',
            component: 'notification_worker'
        });
    }
}

// Export singleton instance
export const notificationWorker = new NotificationWorker();

// Auto-start jika file ini dijalankan langsung
if (require.main === module) {
    notificationWorker.start().catch((error) => {
        logger.error('💥 Notification worker crashed', {
            error: error.message,
            stack: error.stack,
            event: 'worker_crashed',
            component: 'notification_worker'
        });
        process.exit(1);
    });
}
