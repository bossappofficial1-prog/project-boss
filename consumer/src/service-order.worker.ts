import { apiClient } from './lib/api-client';
import logger from './utils/logger';
import { config } from './config';
import amqplib from 'amqplib';

// Tipe data yang relevan
interface ServiceOrderEvent {
    type: 'SERVICE_ORDER_PROCESSING' | 'SERVICE_ORDER_RECHECK';
    payload: {
        orderId: string;
    };
}

interface OrderInQueue {
    id: string;
    outletId: string;
    guestCustomer: {
        phone: string | null;
    };
    outlet?: {
        businessId: string;
    };
}

const QUEUE_NAMES = {
    SERVICE_ORDER: 'service_order_queue',
    SERVICE_ORDER_DLQ: 'service_order_queue_dlq',
    SERVICE_ORDER_RETRY: 'service_order_queue_retry',
};

const EXCHANGE_NAMES = {
    SERVICE_ORDER: 'service_order_exchange',
    SERVICE_ORDER_DLX: 'service_order_dlx',
    SERVICE_ORDER_RETRY: 'service_order_retry_exchange',
};

const RETRY_DELAY_MS = 30 * 1000; // 30 detik

class ServiceOrderWorker {
    private isRunning = false;
    private channel: amqplib.Channel | null = null;

    async start() {
        if (this.isRunning) {
            logger.warn('Service order worker already running', { component: 'ServiceOrderWorker' });
            return;
        }

        try {
            const connection = await amqplib.connect(config.RABBITMQ_URL);
            this.channel = await connection.createChannel();
            const ch = this.channel;

            // Setup Exchanges
            await ch.assertExchange(EXCHANGE_NAMES.SERVICE_ORDER, 'direct', { durable: true });
            await ch.assertExchange(EXCHANGE_NAMES.SERVICE_ORDER_DLX, 'direct', { durable: true });
            await ch.assertExchange(EXCHANGE_NAMES.SERVICE_ORDER_RETRY, 'direct', { durable: true });

            // Setup DLQ
            await ch.assertQueue(QUEUE_NAMES.SERVICE_ORDER_DLQ, { durable: true });
            await ch.bindQueue(QUEUE_NAMES.SERVICE_ORDER_DLQ, EXCHANGE_NAMES.SERVICE_ORDER_DLX, '');

            // Setup Retry Queue
            await ch.assertQueue(QUEUE_NAMES.SERVICE_ORDER_RETRY, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': EXCHANGE_NAMES.SERVICE_ORDER, // Kirim kembali ke exchange utama setelah TTL
                    'x-message-ttl': RETRY_DELAY_MS,
                }
            });
            await ch.bindQueue(QUEUE_NAMES.SERVICE_ORDER_RETRY, EXCHANGE_NAMES.SERVICE_ORDER_RETRY, '');

            // Setup Main Queue
            await ch.assertQueue(QUEUE_NAMES.SERVICE_ORDER, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': EXCHANGE_NAMES.SERVICE_ORDER_DLX,
                }
            });
            await ch.bindQueue(QUEUE_NAMES.SERVICE_ORDER, EXCHANGE_NAMES.SERVICE_ORDER, '');


            ch.prefetch(1);

            this.isRunning = true;
            logger.info('Service order worker started', { component: 'ServiceOrderWorker' });

            this.channel.consume(QUEUE_NAMES.SERVICE_ORDER, async (msg) => {
                if (msg) {
                    await this.processMessage(msg);
                }
            }, { noAck: false });

        } catch (error: any) {
            logger.error('Failed to start service order worker', {
                component: 'ServiceOrderWorker',
                error: error.message,
            });
            throw error;
        }
    }

    private async processMessage(msg: amqplib.ConsumeMessage) {
        let messageData: ServiceOrderEvent;
        try {
            messageData = JSON.parse(msg.content.toString());
            logger.info('Processing service order message', {
                component: 'ServiceOrderWorker',
                messageType: messageData.type,
                orderId: messageData.payload.orderId,
            });

            switch (messageData.type) {
                case 'SERVICE_ORDER_PROCESSING':
                    await this.handleServiceOrderProcessing(messageData);
                    break;
                case 'SERVICE_ORDER_RECHECK':
                    await this.handleServiceOrderRecheck(messageData);
                    break;
                default:
                    logger.warn('Unknown message type', {
                        component: 'ServiceOrderWorker',
                        messageType: (messageData as any).type,
                    });
            }

            this.channel?.ack(msg);
        } catch (error: any) {
            const headers = msg.properties.headers || {};
            const retryCount = (headers['x-retry-count'] || 0) + 1;
            const MAX_RETRIES = 5;

            if (retryCount > MAX_RETRIES) {
                logger.error(`Max retries exceeded for order ${messageData!.payload.orderId}. Sending to DLQ.`, { component: 'ServiceOrderWorker' });
                this.channel?.nack(msg, false, false); // Kirim ke DLQ
            } else {
                logger.warn(`Retrying message for order ${messageData!.payload.orderId}. Attempt: ${retryCount}`, { component: 'ServiceOrderWorker' });
                headers['x-retry-count'] = retryCount;
                // Publish ke exchange retry
                this.channel?.publish(EXCHANGE_NAMES.SERVICE_ORDER_RETRY, '', msg.content, { headers });
                // Ack pesan asli agar tidak diproses lagi
                this.channel?.ack(msg);
            }
        }
    }

    private async handleServiceOrderProcessing(event: ServiceOrderEvent) {
        const { orderId } = event.payload;

        // 1. Dapatkan detail pesanan untuk mengetahui outletId
        const orderResponse = await apiClient.get(`/internal/order/${orderId}`);
        const order: OrderInQueue = orderResponse.data.data;

        // 2. Dapatkan seluruh antrian untuk outlet tersebut
        const queueResponse = await apiClient.get(`/internal/outlet-queue/${order.outletId}`);
        const queue: OrderInQueue[] = queueResponse.data.data;

        const orderIndex = queue.findIndex(o => o.id === orderId);
        if (orderIndex !== -1 && order.guestCustomer.phone) {
            const queuePosition = orderIndex + 1;
            logger.info(`Order ${orderId} is at position ${queuePosition} in outlet ${order.outletId}`, {
                component: 'ServiceOrderWorker',
            });

            // 3. Kirim notifikasi posisi antrian
            await apiClient.post('/internal/send-queue-notification', {
                phone: order.guestCustomer.phone,
                position: queuePosition,
                businessId: order.outlet?.businessId,
            });
        }
    }

    private async handleServiceOrderRecheck(event: ServiceOrderEvent) {
        const { orderId } = event.payload;

        // 1. Dapatkan detail pesanan yang selesai untuk mengetahui outletId
        const completedOrderResponse = await apiClient.get(`/internal/order/${orderId}`);
        const completedOrder: OrderInQueue = completedOrderResponse.data.data;

        // 2. Dapatkan sisa antrian untuk outlet tersebut
        const queueResponse = await apiClient.get(`/internal/outlet-queue/${completedOrder.outletId}`);
        const pendingOrders: OrderInQueue[] = queueResponse.data.data;

        logger.info(`Rechecking queue for outlet ${completedOrder.outletId}. ${pendingOrders.length} orders pending.`, {
            component: 'ServiceOrderWorker',
        });

        // 3. Kirim notifikasi update posisi ke semua yang tersisa di antrian
        for (let i = 0; i < pendingOrders.length; i++) {
            const order = pendingOrders[i];
            if (order.guestCustomer.phone) {
                await apiClient.post('/internal/send-queue-notification', {
                    phone: order.guestCustomer.phone,
                    position: i + 1,
                    businessId: order.outlet?.businessId || completedOrder.outlet?.businessId,
                });
            }
        }
    }

    stop() {
        this.isRunning = false;
        logger.info('Service order worker stopped', { component: 'ServiceOrderWorker' });
    }
}

export const serviceOrderWorker = new ServiceOrderWorker();

if (require.main === module) {
    serviceOrderWorker.start();
}
