import amqplib from 'amqplib';
import { config } from '../config/index.js';
import logger from '../utils/pino.logger.js';
import { snap } from '../config/midtrans.js';
import { handlePaymentSuccess, handlePaymentFailure } from '../service/payment-update.service.js';

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

    async start(sharedChannel?: amqplib.Channel) {
        if (this.isRunning) {
            logger.warn({ component: 'PaymentWorker' }, 'Payment worker already running');
            return;
        }
        this.isRunning = true;
        try {
            if (sharedChannel) {
                this.channel = sharedChannel;
            } else {
                const connection = await amqplib.connect(config.rabbitmq.url);
                this.channel = await connection.createChannel();
            }
            const ch = this.channel;

            // Setup Exchanges
            await ch.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });
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

            logger.info({ component: 'PaymentWorker' }, 'Payment worker started');
            ch.consume(QUEUE_NAME, (msg) => this.processMessage(msg), { noAck: false });

        } catch (error: any) {
            this.isRunning = false;
            logger.error({ component: 'PaymentWorker', error: error.message }, 'Failed to start payment worker');
            throw error;
        }
    }

    private async processMessage(msg: amqplib.ConsumeMessage | null) {
        if (!msg) return;

        let event: PaymentWebhookEvent;
        try {
            event = JSON.parse(msg.content.toString());
            logger.info({ component: 'PaymentWorker' }, `Processing payment webhook from: ${event.payload.source}`);

            if (event.payload.source === 'midtrans') {
                await this.handleMidtransWebhook(event.payload.payload);
            }

            this.channel?.ack(msg);
        } catch (error: any) {
            logger.error({
                component: 'PaymentWorker',
                error: error.message,
                payload: msg.content.toString()
            }, 'Failed to process payment webhook');

            const headers = msg.properties.headers || {};
            const retryCount = (headers['x-retry-count'] || 0) + 1;
            if (retryCount > 5) {
                logger.error({ component: 'PaymentWorker' }, 'Max retries exceeded for webhook. Sending to DLQ.');
                this.channel?.nack(msg, false, false); // Kirim ke DLQ
            } else {
                logger.warn({ component: 'PaymentWorker' }, `Retrying webhook processing. Attempt: ${retryCount}`);
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
        } else if (transactionStatus == 'cancel') {
            paymentStatus = 'CANCELLED';
        } else if (transactionStatus == 'deny') {
            paymentStatus = 'FAILED';
        } else if (transactionStatus == 'expire') {
            paymentStatus = 'EXPIRED';
        }

        if (paymentStatus === 'PENDING') {
            logger.info({ component: 'PaymentWorker' }, `Payment for order ${orderId} is still pending. No action taken.`);
            return;
        }

        logger.info({ component: 'PaymentWorker' }, `Updating payment status for order ${orderId} to ${paymentStatus}`);
        
        if (paymentStatus === 'SUCCESS') {
            await handlePaymentSuccess(orderId);
        } else {
            await handlePaymentFailure(orderId);
        }
    }

    stop() {
        this.isRunning = false;
        logger.info({ component: 'PaymentWorker' }, 'Payment worker stopped');
    }
}

export const paymentWorker = new PaymentWorker();
