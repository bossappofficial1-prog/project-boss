import amqplib from 'amqplib';
import { config } from './config';
import logger from './utils/logger';
import { snap } from './lib/midtrans';
import apiClient from './lib/api-client';

const QUEUE_NAME = 'payment_webhook_queue';
const EXCHANGE_NAME = 'payment_webhook_exchange';
const DLQ_NAME = 'payment_webhook_queue_dlq';
const RETRY_QUEUE_NAME = 'payment_webhook_queue_retry';
const DLX_NAME = 'payment_webhook_dlx';
const RETRY_EXCHANGE_NAME = 'payment_webhook_retry_exchange';
const RETRY_DELAY_MS = 60 * 1000; // Coba lagi setelah 1 menit

interface PaymentWebhookEvent {
    type: 'PAYMENT_WEBHOOK_RECEIVED';
    payload: {
        source: 'midtrans' | 'xendit';
        payload: any;
    };
}

class PaymentWorker {
    private channel: amqplib.Channel | null = null;
    private isRunning = false;

    async start() {
        if (this.isRunning) {
            logger.warn('Payment worker already running', { component: 'PaymentWorker' });
            return;
        }
        this.isRunning = true;
        try {
            const connection = await amqplib.connect(config.RABBITMQ_URL);
            this.channel = await connection.createChannel();
            const ch = this.channel;

            // Setup Exchanges
            await ch.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
            await ch.assertExchange(DLX_NAME, 'direct', { durable: true });
            await ch.assertExchange(RETRY_EXCHANGE_NAME, 'direct', { durable: true });

            // Setup DLQ
            await ch.assertQueue(DLQ_NAME, { durable: true });
            await ch.bindQueue(DLQ_NAME, DLX_NAME, '');

            // Setup Retry Queue
            await ch.assertQueue(RETRY_QUEUE_NAME, {
                durable: true,
                arguments: { 'x-dead-letter-exchange': EXCHANGE_NAME, 'x-message-ttl': RETRY_DELAY_MS }
            });
            await ch.bindQueue(RETRY_QUEUE_NAME, RETRY_EXCHANGE_NAME, '');

            // Setup Main Queue
            await ch.assertQueue(QUEUE_NAME, {
                durable: true,
                arguments: { 'x-dead-letter-exchange': DLX_NAME }
            });
            await ch.bindQueue(QUEUE_NAME, EXCHANGE_NAME, '');

            logger.info('Payment worker started', { component: 'PaymentWorker' });
            // Gunakan manual acknowledgement (noAck: false)
            ch.consume(QUEUE_NAME, (msg) => this.processMessage(msg), { noAck: false });

        } catch (error: any) {
            this.isRunning = false;
            logger.error('Failed to start payment worker', { component: 'PaymentWorker', error: error.message });
            throw error;
        }
    }

    private async processMessage(msg: amqplib.ConsumeMessage | null) {
        if (!msg) return;

        const event: PaymentWebhookEvent = JSON.parse(msg.content.toString());
        logger.info(`Processing payment webhook from: ${event.payload.source}`, { component: 'PaymentWorker' });

        try {
            if (event.payload.source === 'midtrans') {
                await this.handleMidtransWebhook(event.payload.payload);
            }
            // Tambahkan handler untuk xendit di sini jika perlu

            // Jika berhasil, acknowledge pesannya
            this.channel?.ack(msg);
        } catch (error: any) {
            logger.error('Failed to process payment webhook', {
                component: 'PaymentWorker',
                error: error.message, // Log pesan error yang lebih spesifik
                payload: event.payload
            });

            // Implementasikan mekanisme retry dan DLQ
            const headers = msg.properties.headers || {};
            const retryCount = (headers['x-retry-count'] || 0) + 1;
            if (retryCount > 5) {
                logger.error(`Max retries exceeded for webhook. Sending to DLQ.`, { component: 'PaymentWorker' });
                this.channel?.nack(msg, false, false); // Kirim ke DLQ
            } else {
                logger.warn(`Retrying webhook processing. Attempt: ${retryCount}`, { component: 'PaymentWorker' });
                headers['x-retry-count'] = retryCount;
                this.channel?.publish(RETRY_EXCHANGE_NAME, '', msg.content, { headers });
                this.channel?.ack(msg); // Ack pesan asli
            }
        }
    }

    private async handleMidtransWebhook(notificationPayload: any) {
        const statusResponse = await snap.transaction.notification(notificationPayload);
        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        let paymentStatus = 'PENDING'; // Default

        if (transactionStatus == 'capture') {
            if (fraudStatus == 'accept') {
                paymentStatus = 'SUCCESS';
            }
        } else if (transactionStatus == 'settlement') {
            paymentStatus = 'SUCCESS';
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            paymentStatus = 'FAILED';
        }

        if (paymentStatus === 'PENDING') {
            logger.info(`Payment for order ${orderId} is still pending. No action taken.`, { component: 'PaymentWorker' });
            return;
        }

        // Panggil API internal di backend untuk update status
        logger.info(`Updating payment status for order ${orderId} to ${paymentStatus}`, { component: 'PaymentWorker' });
        await apiClient.post(`/internal/orders/update-payment-status`, {
            orderId,
            paymentStatus,
            // Sertakan detail lain jika diperlukan oleh backend
        });
    }

    stop() {
        this.isRunning = false;
        logger.info('Payment worker stopped', { component: 'PaymentWorker' });
    }
}

export const paymentWorker = new PaymentWorker();
