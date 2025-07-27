import amqplib from 'amqplib';
import { config } from './config';
import logger from './utils/logger';
import { EmailService } from './service/email.service';

const QUEUE_NAME = 'email_queue';
const DLQ_NAME = 'email_queue_dlq';
const RETRY_QUEUE_NAME = 'email_queue_retry';
const EXCHANGE_NAME = 'email_exchange'; // Pastikan nama ini cocok
const DLX_NAME = 'email_dlx';
const RETRY_EXCHANGE_NAME = 'email_retry_exchange';
const RETRY_DELAY_MS = 60 * 1000; // 1 menit

interface EmailEvent {
    type: 'SEND_VERIFICATION_EMAIL';
    payload: {
        to: string;
        code: string;
    };
}

class EmailWorker {
    private channel: amqplib.Channel | null = null;
    private isRunning = false;

    async start() {
        if (this.isRunning) {
            logger.warn('Email worker already running', { component: 'EmailWorker' });
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

            logger.info('Email worker started', { component: 'EmailWorker' });
            ch.consume(QUEUE_NAME, (msg) => this.processMessage(msg), { noAck: false });

        } catch (error: any) {
            this.isRunning = false;
            logger.error('Failed to start email worker', { component: 'EmailWorker', error: error.message });
            throw error;
        }
    }

    private async processMessage(msg: amqplib.ConsumeMessage | null) {
        if (!msg) return;

        let event: EmailEvent;
        try {
            event = JSON.parse(msg.content.toString());
            logger.info(`Processing email event: ${event.type}`, { component: 'EmailWorker', to: event.payload.to });

            switch (event.type) {
                case 'SEND_VERIFICATION_EMAIL':
                    await EmailService.sendEmail({
                        to: event.payload.to,
                        subject: 'Verifikasi Akun Anda',
                        text: `Kode verifikasi Anda adalah: ${event.payload.code}`,
                        html: `<p>Kode verifikasi Anda adalah: <strong>${event.payload.code}</strong></p>`,
                    });
                    break;
                default:
                    logger.warn('Unknown email event type', { component: 'EmailWorker', type: (event as any).type });
            }

            this.channel?.ack(msg);
        } catch (error) {
            const headers = msg.properties.headers || {};
            const retryCount = (headers['x-retry-count'] || 0) + 1;
            if (retryCount > 5) {
                logger.error(`Max retries exceeded for email to ${event!.payload.to}. Sending to DLQ.`, { component: 'EmailWorker' });
                this.channel?.nack(msg, false, false);
            } else {
                logger.warn(`Retrying email to ${event!.payload.to}. Attempt: ${retryCount}`, { component: 'EmailWorker' });
                headers['x-retry-count'] = retryCount;
                this.channel?.publish(RETRY_EXCHANGE_NAME, '', msg.content, { headers });
                this.channel?.ack(msg);
            }
        }
    }

    stop() {
        this.isRunning = false;
        logger.info('Email worker stopped', { component: 'EmailWorker' });
    }
}

export const emailWorker = new EmailWorker();
