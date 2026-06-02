import amqplib from 'amqplib';
import { config } from '../config/index.js';
import logger from '../utils/pino.logger.js';
import { EmailService } from '../service/email.service.js';
import { EmailTemplates } from '../templates/email.templates.js';

const QUEUE_NAME = 'email_queue';
const DLQ_NAME = 'email_queue_dlq';
const RETRY_QUEUE_NAME = 'email_queue_retry';
const EXCHANGE_NAME = 'email_exchange';
const DLX_NAME = 'email_dlx';
const RETRY_EXCHANGE_NAME = 'email_retry_exchange';
const RETRY_DELAY_MS = 60 * 1000; // 1 menit

interface EmailEvent {
    type: 'SEND_VERIFICATION_EMAIL' | 'RESEND_VERIFICATION_EMAIL' | 'FORGOT_PASSWORD_EMAIL';
    payload: {
        to: string;
        code?: string;
        resetToken?: string;
    };
}

class EmailWorker {
    private channel: amqplib.Channel | null = null;
    private isRunning = false;

    async start(sharedChannel?: amqplib.Channel) {
        if (this.isRunning) {
            logger.warn({ component: 'EmailWorker' }, 'Email worker already running');
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

            logger.info({ component: 'EmailWorker' }, 'Email worker started');
            ch.consume(QUEUE_NAME, (msg) => this.processMessage(msg), { noAck: false });

        } catch (error: any) {
            this.isRunning = false;
            logger.error({ component: 'EmailWorker', error: error.message }, 'Failed to start email worker');
            throw error;
        }
    }

    private async processMessage(msg: amqplib.ConsumeMessage | null) {
        if (!msg) return;

        let event: EmailEvent;
        try {
            event = JSON.parse(msg.content.toString());
            logger.info({ component: 'EmailWorker', to: event.payload.to }, `Processing email event: ${event.type}`);

            switch (event.type) {
                case 'SEND_VERIFICATION_EMAIL':
                    if (!event.payload.code) {
                        logger.error({ component: 'EmailWorker' }, 'Missing verification code in SEND_VERIFICATION_EMAIL event');
                        break;
                    }
                    const verificationTemplate = EmailTemplates.getVerificationEmail(event.payload.code);
                    await EmailService.sendEmail({
                        to: event.payload.to,
                        subject: verificationTemplate.subject,
                        text: verificationTemplate.text,
                        html: verificationTemplate.html,
                    });
                    break;
                case 'RESEND_VERIFICATION_EMAIL':
                    if (!event.payload.code) {
                        logger.error({ component: 'EmailWorker' }, 'Missing verification code in RESEND_VERIFICATION_EMAIL event');
                        break;
                    }
                    const resendTemplate = EmailTemplates.getResendVerificationEmail(event.payload.code);
                    await EmailService.sendEmail({
                        to: event.payload.to,
                        subject: resendTemplate.subject,
                        text: resendTemplate.text,
                        html: resendTemplate.html,
                    });
                    break;
                case 'FORGOT_PASSWORD_EMAIL':
                    if (!event.payload.resetToken) {
                        logger.error({ component: 'EmailWorker' }, 'Missing reset token in FORGOT_PASSWORD_EMAIL event');
                        break;
                    }
                    const forgotPasswordTemplate = EmailTemplates.getForgotPasswordEmail(event.payload.resetToken);
                    await EmailService.sendEmail({
                        to: event.payload.to,
                        subject: forgotPasswordTemplate.subject,
                        text: forgotPasswordTemplate.text,
                        html: forgotPasswordTemplate.html,
                    });
                    break;
                default:
                    logger.warn({ component: 'EmailWorker', type: (event as any).type }, 'Unknown email event type');
            }

            this.channel?.ack(msg);
        } catch (error: any) {
            const headers = msg.properties.headers || {};
            const retryCount = (headers['x-retry-count'] || 0) + 1;
            if (retryCount > 5) {
                logger.error({ component: 'EmailWorker' }, `Max retries exceeded for email. Sending to DLQ.`);
                this.channel?.nack(msg, false, false);
            } else {
                logger.warn({ component: 'EmailWorker' }, `Retrying email. Attempt: ${retryCount}`);
                headers['x-retry-count'] = retryCount;
                this.channel?.publish(RETRY_EXCHANGE_NAME, '', msg.content, { headers });
                this.channel?.ack(msg);
            }
        }
    }

    stop() {
        this.isRunning = false;
        logger.info({ component: 'EmailWorker' }, 'Email worker stopped');
    }
}

export const emailWorker = new EmailWorker();
