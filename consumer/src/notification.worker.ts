import apiClient from './lib/api-client';
import logger from './utils/logger';
import { config } from './config';
import amqplib from 'amqplib';
import { NotificationService } from './service/notification.service'; // Import service lokal

// Definisikan tipe data yang diharapkan dari message queue dan API
interface OrderNotificationEvent {
    type: 'ORDER_STATUS_UPDATE';
    payload: {
        orderId: string;
        status: string;
    };
}

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
        let messageData: any;
        try {
            messageData = JSON.parse(msg.content.toString());
            logger.info('Processing notification message', {
                component: 'NotificationWorker',
                messageId: messageData.id,
            });

            if (messageData.type === 'ORDER_STATUS_UPDATE') {
                await this.handleOrderStatusUpdate(messageData);
            } else {
                logger.warn('Unknown message type', {
                    component: 'NotificationWorker',
                    messageType: messageData.type,
                });
            }

            this.channel?.ack(msg);
        } catch (error: any) {
            const headers = msg.properties.headers || {};
            const retryCount = (headers['x-retry-count'] || 0) + 1;
            const MAX_RETRIES = 5;

            if (retryCount > MAX_RETRIES) {
                logger.error(`Max retries exceeded for message ${messageData?.id}. Sending to DLQ.`, { component: 'NotificationWorker' });
                this.channel?.nack(msg, false, false);
            } else {
                logger.warn(`Retrying message ${messageData?.id}. Attempt: ${retryCount}`, { component: 'NotificationWorker' });
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
            // ULTIMATE DEBUGGING: Cetak objek error mentah ke konsol
            console.log("RAW ERROR OBJECT IN CATCH BLOCK:", error);

            // Tambahkan logging yang lebih detail di sini
            logger.error(`Failed to handle order status update for order ${orderId}`, {
                component: 'NotificationWorker',
                orderId,
                errorMessage: error.message,
                // Jika error berasal dari Axios, log detail responsnya
                axiosError: error.response ? JSON.stringify(error.response.data, null, 2) : 'Not an Axios error',
            });
            // Melempar error akan menyebabkan pesan di-nack dan mungkin di-requeue
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
