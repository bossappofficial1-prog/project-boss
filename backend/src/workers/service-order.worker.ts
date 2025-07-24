import { connectRabbitMQ, getRabbitMQChannel } from '../config/rabbitmq';
import { NotificationService } from '../service/notification.service';
import { getOrderByIdService } from '../service/order.service';
import { QUEUE_NAMES, ServiceOrderEvent } from '../service/message-publisher.service';
import { db } from '../config/prisma';
import logger from '../utils/winston.logger';

class ServiceOrderWorker {
    private isRunning = false;

    async start() {
        if (this.isRunning) {
            logger.warn('⚠️ Service order worker already running', {
                event: 'worker_already_running',
                component: 'service_order_worker'
            });
            return;
        }

        try {
            await connectRabbitMQ();
            const channel = getRabbitMQChannel();

            await channel.assertQueue(QUEUE_NAMES.SERVICE_ORDER, { durable: true });

            // Set prefetch untuk load balancing
            channel.prefetch(1);

            this.isRunning = true;

            logger.info('🚀 Service order worker started', {
                event: 'service_order_worker_started',
                component: 'service_order_worker',
                queue: QUEUE_NAMES.SERVICE_ORDER
            });

            channel.consume(QUEUE_NAMES.SERVICE_ORDER, async (msg) => {
                if (msg) {
                    await this.processMessage(msg, channel);
                }
            }, { noAck: false });

        } catch (error: any) {
            logger.error('❌ Failed to start service order worker', {
                error: error.message,
                stack: error.stack,
                event: 'worker_start_failed',
                component: 'service_order_worker'
            });
            throw error;
        }
    }

    private async processMessage(msg: any, channel: any) {
        const startTime = Date.now();
        let messageData: any;

        try {
            messageData = JSON.parse(msg.content.toString());

            logger.info('📨 Processing service order message', {
                event: 'service_order_processing',
                component: 'service_order_worker',
                messageId: messageData.id,
                messageType: messageData.type,
                orderId: messageData.payload?.orderId
            });

            switch (messageData.type) {
                case 'SERVICE_ORDER_PROCESSING':
                    await this.handleServiceOrderProcessing(messageData as ServiceOrderEvent);
                    break;
                case 'SERVICE_ORDER_RECHECK':
                    await this.handleServiceOrderRecheck(messageData as ServiceOrderEvent);
                    break;
                default:
                    logger.warn('⚠️ Unknown message type', {
                        event: 'unknown_message_type',
                        component: 'service_order_worker',
                        messageType: messageData.type
                    });
            }

            channel.ack(msg);

            logger.info('✅ Service order message processed', {
                event: 'service_order_processed',
                component: 'service_order_worker',
                messageId: messageData.id,
                processingTime: Date.now() - startTime
            });

        } catch (error: any) {
            logger.error('❌ Failed to process service order message', {
                error: error.message,
                stack: error.stack,
                event: 'service_order_processing_failed',
                component: 'service_order_worker',
                messageId: messageData?.id,
                processingTime: Date.now() - startTime
            });

            const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
            if (retryCount > 3) {
                logger.error('💀 Message max retries exceeded', {
                    event: 'message_max_retries',
                    component: 'service_order_worker',
                    messageId: messageData?.id,
                    retryCount
                });
                channel.nack(msg, false, false);
            } else {
                logger.warn('🔄 Retrying message', {
                    event: 'message_retry',
                    component: 'service_order_worker',
                    messageId: messageData?.id,
                    retryCount
                });
                msg.properties.headers = { ...msg.properties.headers, 'x-retry-count': retryCount };
                channel.nack(msg, false, true);
            }
        }
    }

    private async handleServiceOrderProcessing(event: ServiceOrderEvent) {
        const { orderId } = event.payload;

        logger.info('🔄 Processing service order', {
            event: 'service_order_queue_processing',
            component: 'service_order_worker',
            orderId
        });

        const order = await getOrderByIdService(orderId);
        if (!order) {
            logger.warn('⚠️ Order not found, skipping', {
                event: 'order_not_found',
                component: 'service_order_worker',
                orderId
            });
            return;
        }

        // Ambil semua pesanan yang sedang mengantri untuk outlet yang sama
        const queueForOutlet = await db.order.findMany({
            where: {
                outletId: order.outletId,
                orderStatus: 'PROCESSING',
            },
            include: {
                guestCustomer: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        logger.info('📊 Queue status', {
            event: 'queue_status',
            component: 'service_order_worker',
            outletId: order.outletId,
            queueLength: queueForOutlet.length
        });

        // Cari posisi pesanan dalam antrian
        const orderIndex = queueForOutlet.findIndex(o => o.id === orderId);

        if (orderIndex !== -1) {
            const queuePosition = orderIndex + 1;
            const currentOrder = queueForOutlet[orderIndex];

            logger.info('📍 Order position in queue', {
                event: 'order_queue_position',
                component: 'service_order_worker',
                orderId,
                position: queuePosition,
                totalInQueue: queueForOutlet.length
            });

            if (currentOrder.guestCustomer.phone) {
                await NotificationService.sendQueueNotification(
                    currentOrder.guestCustomer.phone,
                    queuePosition
                );
            }
        }
    }

    private async handleServiceOrderRecheck(event: ServiceOrderEvent) {
        const { orderId } = event.payload;

        logger.info('🔍 Rechecking service order queue', {
            event: 'service_order_recheck',
            component: 'service_order_worker',
            triggeredBy: orderId
        });

        const completedOrder = await getOrderByIdService(orderId);
        if (!completedOrder) {
            return;
        }

        // Recheck semua pesanan yang masih dalam antrian untuk outlet ini
        const pendingOrders = await db.order.findMany({
            where: {
                outletId: completedOrder.outletId,
                orderStatus: 'PROCESSING',
            },
            include: {
                guestCustomer: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        logger.info('🔄 Updating queue positions after completion', {
            event: 'queue_recheck_update',
            component: 'service_order_worker',
            outletId: completedOrder.outletId,
            pendingOrders: pendingOrders.length
        });

        // Kirim notifikasi update posisi untuk semua pesanan yang masih mengantri
        for (let i = 0; i < pendingOrders.length; i++) {
            const order = pendingOrders[i];
            if (order.guestCustomer.phone) {
                await NotificationService.sendQueueNotification(
                    order.guestCustomer.phone,
                    i + 1
                );
            }
        }
    }

    stop() {
        this.isRunning = false;
        logger.info('🛑 Service order worker stopped', {
            event: 'service_order_worker_stopped',
            component: 'service_order_worker'
        });
    }
}

export const serviceOrderWorker = new ServiceOrderWorker();

if (require.main === module) {
    serviceOrderWorker.start().catch((error) => {
        logger.error('💥 Service order worker crashed', {
            error: error.message,
            stack: error.stack,
            event: 'worker_crashed',
            component: 'service_order_worker'
        });
        process.exit(1);
    });
}
