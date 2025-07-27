import { getRabbitMQChannel } from '../config/rabbitmq';
import logger from '../utils/winston.logger';

// Base interface for all events
interface BaseEvent<T, P> {
    type: T;
    payload: P;
}

// Event types for specific events
type OrderNotificationEvent = BaseEvent<'ORDER_STATUS_UPDATE', { orderId: string; status: string }>;
type ServiceOrderEvent = BaseEvent<'SERVICE_ORDER_PROCESSING' | 'SERVICE_ORDER_RECHECK', { orderId: string; trigger?: string }>;
type PaymentReminderEvent = BaseEvent<'PAYMENT_REMINDER', { orderId: string; expiresAt: Date }>;
type VerificationEmailEvent = BaseEvent<'SEND_VERIFICATION_EMAIL', { to: string; code: string }>;
type PaymentWebhookEvent = BaseEvent<'PAYMENT_WEBHOOK_RECEIVED', { source: 'midtrans' | 'xendit', payload: any }>;

// Union type for all queue events, now including the email event
export type QueueEvent = OrderNotificationEvent | ServiceOrderEvent | PaymentReminderEvent | VerificationEmailEvent | PaymentWebhookEvent;

// Exchange names as constants
export const EXCHANGE_NAMES = {
    NOTIFICATION: 'notification_exchange',
    SERVICE_ORDER: 'service_order_exchange',
    EMAIL: 'email_exchange',
    PAYMENT_WEBHOOK: 'payment_webhook_exchange',
} as const;

class MessagePublisherService {
    private async publish(exchangeName: string, routingKey: string, event: QueueEvent) {
        try {
            const channel = getRabbitMQChannel();

            const message = {
                ...event,
                timestamp: new Date().toISOString(),
                id: `${event.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            // Publish to an exchange instead of sending directly to a queue
            channel.publish(
                exchangeName,
                routingKey, // routingKey is often empty for 'fanout' or matches queue name for 'direct'
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );

            logger.info('📤 Message published to exchange', {
                event: 'message_published',
                component: 'message_publisher',
                exchange: exchangeName,
                messageType: event.type,
                messageId: message.id,
            });
        } catch (error: any) {
            logger.error('❌ Failed to publish message', {
                error: error.message,
                exchange: exchangeName,
                messageType: event.type,
                event: 'message_publish_failed',
                component: 'message_publisher'
            });
            throw error;
        }
    }

    // Publisher methods now use exchanges
    async publishOrderNotification(orderId: string, status: string) {
        await this.publish(EXCHANGE_NAMES.NOTIFICATION, '', {
            type: 'ORDER_STATUS_UPDATE',
            payload: { orderId, status }
        });
    }

    async publishServiceOrderProcessing(orderId: string) {
        await this.publish(EXCHANGE_NAMES.SERVICE_ORDER, '', {
            type: 'SERVICE_ORDER_PROCESSING',
            payload: { orderId }
        });
    }

    async publishServiceOrderRecheck(orderId: string) {
        await this.publish(EXCHANGE_NAMES.SERVICE_ORDER, '', {
            type: 'SERVICE_ORDER_RECHECK',
            payload: { orderId }
        });
    }

    async publishOrderStatusUpdate(orderId: string, status: string) {
        await this.publish(EXCHANGE_NAMES.NOTIFICATION, '', {
            type: 'ORDER_STATUS_UPDATE',
            payload: { orderId, status }
        });
    }

    async publishSendVerificationEmail(to: string, code: string) {
        await this.publish(EXCHANGE_NAMES.EMAIL, '', {
            type: 'SEND_VERIFICATION_EMAIL',
            payload: { to, code }
        });
    }

    async publishPaymentWebhookReceived(payload: any, source: 'midtrans' | 'xendit') {
        await this.publish(EXCHANGE_NAMES.PAYMENT_WEBHOOK, '', {
            type: 'PAYMENT_WEBHOOK_RECEIVED',
            payload: { source, payload }
        });
    }
}

export const messagePublisher = new MessagePublisherService();
