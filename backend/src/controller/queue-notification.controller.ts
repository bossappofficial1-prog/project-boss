import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { ResponseUtil } from '../utils/response';
import { Channel } from 'amqplib';
import { getRabbitMQChannel } from '../config/rabbitmq';
import { HttpStatus } from '../constants/http-status';
import logger from '../utils/pino.logger';

// Queue names - temporary fix until queue.ts is properly set up
const NOTIFICATION_QUEUE = 'notification_queue';
const NOTIFICATION_EXCHANGE = 'notification_exchange';

export const sendQueueNotification = asyncHandler(
    async (req: Request, res: Response) => {
        const { phone, position, businessId } = req.body;

        // Validasi input
        if (!phone || position === undefined) {
            return ResponseUtil.badRequest(res, 'Phone number and queue position are required');
        }

        try {
            // Get RabbitMQ channel
            const channel: Channel = getRabbitMQChannel();

            // Pastikan exchange dan queue ada
            await channel.assertExchange(NOTIFICATION_EXCHANGE, 'fanout', { durable: true });
            await channel.assertQueue(NOTIFICATION_QUEUE, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': 'notification_dlx',
                }
            });
            await channel.bindQueue(NOTIFICATION_QUEUE, NOTIFICATION_EXCHANGE, '');

            // Kirim ke queue notifikasi
            const message = {
                type: 'queue_position',
                data: {
                    phone,
                    position,
                    businessId,
                }
            };

            const published = channel.publish(
                NOTIFICATION_EXCHANGE,
                '',  // Empty routing key since consumer is using default binding
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );

            if (!published) {
                logger.error('Failed to publish message to RabbitMQ', {
                    component: 'QueueNotificationController',
                    phone,
                    position,
                    businessId
                });
                return ResponseUtil.error(res, 'Failed to send queue notification');
            }

            logger.info('Queue notification sent successfully', {
                component: 'QueueNotificationController',
                phone,
                position,
                businessId
            });

            return ResponseUtil.success(
                res,
                { phone, position, businessId },
                HttpStatus.OK,
                'Queue notification sent successfully'
            );
        } catch (error) {
            logger.error('Error sending queue notification:', error);
            return ResponseUtil.error(res, 'Failed to send queue notification');
        }
    }
);
