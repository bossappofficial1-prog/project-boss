import { apiClient } from './lib/api-client';
import logger from './utils/logger';
import { config } from './config';
import amqplib from 'amqplib';
import { NotificationService } from './service/notification.service'; // Import service lokal
import { TwilioService } from './service/twilio.service';
import { NotificationMessageService } from './service/notification-message.service';

// Definisikan tipe data yang diharapkan dari message queue dan API
interface BaseNotificationEvent {
    type: string;
    data: any;
}

interface OrderNotificationEvent extends BaseNotificationEvent {
    type: 'ORDER_STATUS_UPDATE';
    payload: {
        orderId: string;
        status: string;
    };
}

interface QueuePositionEvent extends BaseNotificationEvent {
    type: 'queue_position';
    data: {
        phone: string;
        position: number;
    };
}

interface WhatsAppNotificationEvent extends BaseNotificationEvent {
    type: 'WHATSAPP_PAYMENT_SUCCESS' | 'WHATSAPP_ORDER_CONFIRMATION' | 'WHATSAPP_PICKUP_REMINDER' | 'WHATSAPP_PAYMENT_AND_ORDER_UPDATE';
    payload: {
        orderId: string;
        orderStatus?: string;
    };
}

type NotificationEvent = OrderNotificationEvent | QueuePositionEvent | WhatsAppNotificationEvent;

export interface OrderDetails {
    id: string;
    orderStatus: string;
    guestCustomer: {
        phone: string;
    };
}

const QUEUE_NAMES = {
    NOTIFICATION: 'notification_queue',
    NOTIFICATION_DLQ: 'notification_queue_dlq',
    NOTIFICATION_RETRY: 'notification_queue_retry',
};

const EXCHANGE_NAMES = {
    NOTIFICATION: 'notification_exchange',
    NOTIFICATION_DLX: 'notification_dlx',
    NOTIFICATION_RETRY: 'notification_retry_exchange',
};

const RETRY_DELAY_MS = 30 * 1000; // 30 detik

class NotificationWorker {
    private isRunning = false;
    private channel: amqplib.Channel | null = null;

    async start() {
        if (this.isRunning) {
            logger.warn('Notification worker already running', { component: 'NotificationWorker' });
            return;
        }

        try {
            const connection = await amqplib.connect(config.RABBITMQ_URL);
            this.channel = await connection.createChannel();
            const ch = this.channel;

            // Setup Exchanges
            await ch.assertExchange(EXCHANGE_NAMES.NOTIFICATION, 'direct', { durable: true });
            await ch.assertExchange(EXCHANGE_NAMES.NOTIFICATION_DLX, 'direct', { durable: true });
            await ch.assertExchange(EXCHANGE_NAMES.NOTIFICATION_RETRY, 'direct', { durable: true });

            // Setup DLQ
            await ch.assertQueue(QUEUE_NAMES.NOTIFICATION_DLQ, { durable: true });
            await ch.bindQueue(QUEUE_NAMES.NOTIFICATION_DLQ, EXCHANGE_NAMES.NOTIFICATION_DLX, '');

            // Setup Retry Queue
            await ch.assertQueue(QUEUE_NAMES.NOTIFICATION_RETRY, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': EXCHANGE_NAMES.NOTIFICATION,
                    'x-message-ttl': RETRY_DELAY_MS,
                }
            });
            await ch.bindQueue(QUEUE_NAMES.NOTIFICATION_RETRY, EXCHANGE_NAMES.NOTIFICATION_RETRY, '');

            // Setup Main Queue
            await ch.assertQueue(QUEUE_NAMES.NOTIFICATION, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': EXCHANGE_NAMES.NOTIFICATION_DLX,
                }
            });
            await ch.bindQueue(QUEUE_NAMES.NOTIFICATION, EXCHANGE_NAMES.NOTIFICATION, '');

            ch.prefetch(1);

            this.isRunning = true;
            logger.info('Notification worker started', { component: 'NotificationWorker' });

            this.channel.consume(QUEUE_NAMES.NOTIFICATION, async (msg) => {
                if (msg) {
                    await this.processMessage(msg);
                }
            }, { noAck: false });

        } catch (error: any) {
            logger.error('Failed to start notification worker', {
                component: 'NotificationWorker',
                error: error.message,
            });
            throw error;
        }
    }

    private async processMessage(msg: amqplib.ConsumeMessage) {
        const content = msg.content.toString();
        let messageData: NotificationEvent | any;

        try {
            messageData = JSON.parse(content);

            logger.info('Processing notification message', {
                component: 'NotificationWorker',
                messageType: messageData.type,
                content: content,
            });

            switch (messageData.type) {
                case 'ORDER_STATUS_UPDATE':
                    await this.handleOrderStatusUpdate(messageData as OrderNotificationEvent);
                    break;
                case 'queue_position':
                    await this.handleQueuePosition(messageData as QueuePositionEvent);
                    break;
                case 'WHATSAPP_PAYMENT_SUCCESS':
                case 'WHATSAPP_ORDER_CONFIRMATION':
                case 'WHATSAPP_PICKUP_REMINDER':
                case 'WHATSAPP_PAYMENT_AND_ORDER_UPDATE':
                    await this.handleWhatsAppNotification(messageData as WhatsAppNotificationEvent);
                    break;
                default:
                    logger.warn('Unknown message type', {
                        component: 'NotificationWorker',
                        messageType: messageData.type,
                        content: content,
                    });
            }

            this.channel?.ack(msg);
        } catch (error: any) {
            console.log(error);

            logger.error('Error processing message', {
                component: 'NotificationWorker',
                error: error.message,
                content: content,
                stack: error.stack
            });

            const headers = msg.properties.headers || {};
            const retryCount = (headers['x-retry-count'] || 0) + 1;
            const MAX_RETRIES = 5;

            if (retryCount > MAX_RETRIES) {
                logger.error(`Max retries (${MAX_RETRIES}) exceeded for message. Sending to DLQ.`, {
                    component: 'NotificationWorker',
                    content: content
                });
                this.channel?.nack(msg, false, false);
            } else {
                logger.warn(`Retrying message. Attempt: ${retryCount}/${MAX_RETRIES}`, {
                    component: 'NotificationWorker',
                    content: content
                });
                headers['x-retry-count'] = retryCount;
                this.channel?.publish(EXCHANGE_NAMES.NOTIFICATION_RETRY, '', msg.content, { headers });
                this.channel?.ack(msg);
            }
        }
    }

    private async handleOrderStatusUpdate(event: OrderNotificationEvent) {
        const { orderId, status } = event.payload;

        try {
            // 1. Panggil API backend untuk mendapatkan detail pesanan
            const response = await apiClient.get(`/internal/order/${orderId}`);
            const order: any = response.data.data;

            if (!order.guestCustomer.phone) {
                logger.warn('Order does not have a phone number, skipping notification', {
                    component: 'NotificationWorker',
                    orderId,
                });
                return;
            }

            // await NotificationService.send
            await NotificationService.sendOrderStatusUpdate(
                order.guestCustomer.phone,
                order,
                status,
            );

            logger.info(`Successfully sent status update for order ${orderId} to status ${status}`, {
                component: 'NotificationWorker',
                orderId,
            });

        } catch (error: any) {
            // Tambahkan logging yang lebih detail di sini
            logger.error(`Failed to handle order status update for order ${orderId}`, {
                component: 'NotificationWorker',
                orderId,
                errorMessage: error.message,
                axiosError: error.response ? JSON.stringify(error.response.data, null, 2) : 'Not an Axios error',
            });
            throw error;
        }
    }

    private async handleQueuePosition(event: QueuePositionEvent) {
        const { phone, position } = event.data;

        try {
            await NotificationService.sendQueueNotification(phone, position);

            logger.info('Successfully sent queue position notification', {
                component: 'NotificationWorker',
                phone,
                position,
            });
        } catch (error: any) {
            logger.error('Failed to send queue position notification', {
                component: 'NotificationWorker',
                phone,
                position,
                errorMessage: error.message,
                axiosError: error.response ? JSON.stringify(error.response.data, null, 2) : 'Not an Axios error',
            });
            throw error;
        }
    }

    private async handleWhatsAppNotification(event: WhatsAppNotificationEvent) {
        const { orderId, orderStatus } = event.payload;
        const { type } = event;

        try {
            // 1. Generate pesan berdasarkan tipe notifikasi
            let message: string;
            switch (type) {
                case 'WHATSAPP_PAYMENT_SUCCESS':
                    message = await NotificationMessageService.generatePaymentSuccessMessage(orderId);
                    break;
                case 'WHATSAPP_ORDER_CONFIRMATION':
                    message = await NotificationMessageService.generateOrderConfirmedMessage(orderId);
                    break;
                case 'WHATSAPP_PICKUP_REMINDER':
                    message = await NotificationMessageService.generateReminderMessage(orderId, 'pickup');
                    break;
                case 'WHATSAPP_PAYMENT_AND_ORDER_UPDATE':
                    message = await NotificationMessageService.generateConsolidatedPaymentMessage(orderId, orderStatus || 'PENDING');
                    break;
                default:
                    logger.warn('Unknown WhatsApp notification type', {
                        component: 'NotificationWorker',
                        type,
                        orderId,
                    });
                    return;
            }

            // 2. Panggil API backend untuk mendapatkan data notifikasi (untuk nomor telepon)
            let orderData;
            if (orderId === 'TEST123') {
                // Untuk test order, gunakan mock data
                orderData = {
                    guestCustomer: {
                        phone: '+6283180541892'
                    }
                };
                logger.info('🧪 Using mock phone data for WhatsApp test', {
                    component: 'NotificationWorker',
                    orderId
                });
            } else {
                const response = await apiClient.get(`/orders/${orderId}/notification-data`);
                orderData = response.data.data;
            }

            if (!orderData.guestCustomer.phone) {
                logger.warn('Order does not have a phone number, skipping WhatsApp notification', {
                    component: 'NotificationWorker',
                    orderId,
                    type,
                });
                return;
            }

            // 3. Kirim pesan WhatsApp menggunakan NotificationService yang sudah ada
            await NotificationService.sendCustomWhatsAppMessage(orderData.guestCustomer.phone, message);

            logger.info(`Successfully sent WhatsApp ${type} notification for order ${orderId}`, {
                component: 'NotificationWorker',
                orderId,
                type,
                phone: orderData.guestCustomer.phone
            });

        } catch (error: any) {
            logger.error(`Failed to handle WhatsApp notification for order ${orderId}`, {
                component: 'NotificationWorker',
                orderId,
                type,
                errorMessage: error.message,
                axiosError: error.response ? JSON.stringify(error.response.data, null, 2) : 'Not an Axios error',
            });
            throw error;
        }
    }

    stop() {
        this.isRunning = false;
        logger.info('Notification worker stopped', { component: 'NotificationWorker' });
    }
}

export const notificationWorker = new NotificationWorker();

if (require.main === module) {
    notificationWorker.start();
}
