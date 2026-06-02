import amqplib from 'amqplib';
import { config } from '../config/index.js';
import logger from '../utils/pino.logger.js';
import { db } from '../config/prisma.js';

const QUEUE_NAME = 'service_order_queue';
const EXCHANGE_NAME = 'service_order_exchange';
const DLQ_NAME = 'service_order_queue_dlq';
const RETRY_QUEUE_NAME = 'service_order_queue_retry';
const DLX_NAME = 'service_order_dlx';
const RETRY_EXCHANGE_NAME = 'service_order_retry_exchange';
const RETRY_DELAY_MS = 30 * 1000; // 30 detik

interface ServiceOrderEvent {
    type: 'SERVICE_ORDER_PROCESSING' | 'SERVICE_ORDER_RECHECK';
    payload: {
        orderId: string;
    };
}

class ServiceOrderWorker {
    private isRunning = false;
    private channel: amqplib.Channel | null = null;

    async start(sharedChannel?: amqplib.Channel) {
        if (this.isRunning) {
            logger.warn({ component: 'ServiceOrderWorker' }, 'Service order worker already running');
            return;
        }

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
            await ch.assertExchange(EXCHANGE_NAME + '_dlx', 'direct', { durable: true });
            await ch.assertExchange(EXCHANGE_NAME + '_retry', 'direct', { durable: true });

            // Setup DLQ
            await ch.assertQueue(DLQ_NAME, { durable: true });
            await ch.bindQueue(DLQ_NAME, EXCHANGE_NAME + '_dlx', '');

            // Setup Retry Queue
            await ch.assertQueue(RETRY_QUEUE_NAME, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': EXCHANGE_NAME,
                    'x-message-ttl': RETRY_DELAY_MS,
                }
            });
            await ch.bindQueue(RETRY_QUEUE_NAME, EXCHANGE_NAME + '_retry', '');

            // Setup Main Queue
            await ch.assertQueue(QUEUE_NAME, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': EXCHANGE_NAME + '_dlx',
                }
            });
            await ch.bindQueue(QUEUE_NAME, EXCHANGE_NAME, '');

            ch.prefetch(1);
            this.isRunning = true;
            logger.info({ component: 'ServiceOrderWorker' }, 'Service order worker started');

            ch.consume(QUEUE_NAME, async (msg) => {
                if (msg) {
                    await this.processMessage(msg);
                }
            }, { noAck: false });

        } catch (error: any) {
            logger.error({
                component: 'ServiceOrderWorker',
                error: error.message,
            }, 'Failed to start service order worker');
            throw error;
        }
    }

    private async processMessage(msg: amqplib.ConsumeMessage) {
        let messageData: ServiceOrderEvent;
        try {
            messageData = JSON.parse(msg.content.toString());
            logger.info({
                component: 'ServiceOrderWorker',
                messageType: messageData.type,
                orderId: messageData.payload.orderId,
            }, 'Processing service order message');

            switch (messageData.type) {
                case 'SERVICE_ORDER_PROCESSING':
                    await this.handleServiceOrderProcessing(messageData);
                    break;
                case 'SERVICE_ORDER_RECHECK':
                    await this.handleServiceOrderRecheck(messageData);
                    break;
                default:
                    logger.warn({
                        component: 'ServiceOrderWorker',
                        messageType: (messageData as any).type,
                    }, 'Unknown message type');
            }

            this.channel?.ack(msg);
        } catch (error: any) {
            const headers = msg.properties.headers || {};
            const retryCount = (headers['x-retry-count'] || 0) + 1;
            const MAX_RETRIES = 5;

            if (retryCount > MAX_RETRIES) {
                logger.error({ component: 'ServiceOrderWorker' }, `Max retries exceeded. Sending to DLQ.`);
                this.channel?.nack(msg, false, false); // Kirim ke DLQ
            } else {
                logger.warn({ component: 'ServiceOrderWorker' }, `Retrying message. Attempt: ${retryCount}`);
                headers['x-retry-count'] = retryCount;
                this.channel?.publish(EXCHANGE_NAME + '_retry', '', msg.content, { headers });
                this.channel?.ack(msg);
            }
        }
    }

    private async handleServiceOrderProcessing(event: ServiceOrderEvent) {
        const { orderId } = event.payload;

        const order = await db.order.findUnique({
            where: { id: orderId },
            include: { guestCustomer: true }
        });

        if (!order) {
            logger.warn({ component: 'ServiceOrderWorker', orderId }, 'Order not found for processing');
            return;
        }

        const queue = await db.order.findMany({
            where: { outletId: order.outletId, orderStatus: 'PROCESSING' },
            orderBy: { createdAt: 'asc' },
        });

        const orderIndex = queue.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            const queuePosition = orderIndex + 1;
            logger.info({
                component: 'ServiceOrderWorker',
                orderId,
                queuePosition,
                outletId: order.outletId
            }, `Order is at queue position`);
            // WhatsApp notification skipped: Twilio/WhatsApp notifications are disabled
        }
    }

    private async handleServiceOrderRecheck(event: ServiceOrderEvent) {
        const { orderId } = event.payload;

        const completedOrder = await db.order.findUnique({
            where: { id: orderId }
        });

        if (!completedOrder) {
            logger.warn({ component: 'ServiceOrderWorker', orderId }, 'Completed order not found for recheck');
            return;
        }

        const pendingOrders = await db.order.findMany({
            where: { outletId: completedOrder.outletId, orderStatus: 'PROCESSING' },
            orderBy: { createdAt: 'asc' },
        });

        logger.info({
            component: 'ServiceOrderWorker',
            outletId: completedOrder.outletId,
            pendingCount: pendingOrders.length
        }, 'Rechecking queue for outlet');

        // WhatsApp notifications skipped: Twilio/WhatsApp notifications are disabled
    }

    stop() {
        this.isRunning = false;
        logger.info({ component: 'ServiceOrderWorker' }, 'Service order worker stopped');
    }
}

export const serviceOrderWorker = new ServiceOrderWorker();
