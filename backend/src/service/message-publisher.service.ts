import { getRabbitMQChannel } from '../config/rabbitmq';
import logger from '../utils/winston.logger';

// Event types untuk type safety
export interface OrderNotificationEvent {
    type: 'ORDER_STATUS_UPDATE';
    payload: {
        orderId: string;
        status: string;
    };
}

export interface ServiceOrderEvent {
    type: 'SERVICE_ORDER_PROCESSING' | 'SERVICE_ORDER_RECHECK';
    payload: {
        orderId: string;
        trigger?: string;
    };
}

export interface PaymentReminderEvent {
    type: 'PAYMENT_REMINDER';
    payload: {
        orderId: string;
        expiresAt: Date;
    };
}

export type QueueEvent = OrderNotificationEvent | ServiceOrderEvent | PaymentReminderEvent;

// Queue names sebagai constants
export const QUEUE_NAMES = {
    NOTIFICATION: 'notification_queue',
    SERVICE_ORDER: 'service_order_queue',
    PAYMENT_REMINDER: 'payment_reminder_queue'
} as const;

class MessagePublisher {
    private async ensureQueue(queueName: string) {
        try {
            const channel = getRabbitMQChannel();
            await channel.assertQueue(queueName, { durable: true });
            return channel;
        } catch (error: any) {
            logger.error('❌ Failed to ensure queue', {
                error: error.message,
                queue: queueName,
                event: 'queue_ensure_failed',
                component: 'message_publisher'
            });
            throw error;
        }
    }

    private async publish(queueName: string, event: QueueEvent) {
        try {
            const channel = await this.ensureQueue(queueName);

            const message = {
                ...event,
                timestamp: new Date().toISOString(),
                id: `${event.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            channel.sendToQueue(
                queueName,
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );

            logger.info('📤 Message published', {
                event: 'message_published',
                component: 'message_publisher',
                queue: queueName,
                messageType: event.type,
                messageId: message.id,
                payload: event.payload
            });
        } catch (error: any) {
            logger.error('❌ Failed to publish message', {
                error: error.message,
                queue: queueName,
                messageType: event.type,
                event: 'message_publish_failed',
                component: 'message_publisher'
            });
            throw error;
        }
    }

    // Publisher methods untuk setiap event type
    async publishOrderNotification(orderId: string, status: string) {
        await this.publish(QUEUE_NAMES.NOTIFICATION, {
            type: 'ORDER_STATUS_UPDATE',
            payload: { orderId, status }
        });
    }

    async publishServiceOrderProcessing(orderId: string) {
        await this.publish(QUEUE_NAMES.SERVICE_ORDER, {
            type: 'SERVICE_ORDER_PROCESSING',
            payload: { orderId }
        });
    }

    async publishServiceOrderRecheck(orderId: string) {
        await this.publish(QUEUE_NAMES.SERVICE_ORDER, {
            type: 'SERVICE_ORDER_RECHECK',
            payload: { orderId, trigger: 're-check' }
        });
    }

    async publishPaymentReminder(orderId: string, expiresAt: Date) {
        await this.publish(QUEUE_NAMES.PAYMENT_REMINDER, {
            type: 'PAYMENT_REMINDER',
            payload: { orderId, expiresAt }
        });
    }
}

export const messagePublisher = new MessagePublisher();
