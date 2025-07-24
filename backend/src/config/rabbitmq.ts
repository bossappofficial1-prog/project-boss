import * as amqp from 'amqplib';
import { config } from '.';
import logger from '../utils/winston.logger';

let channel: amqp.Channel;
let connection: amqp.Connection | any;

const RETRY_DELAY = 5000; // 5 seconds

const handleDisconnect = () => {
    logger.info(`Retrying RabbitMQ connection in ${RETRY_DELAY / 1000} seconds...`);
    setTimeout(connectRabbitMQ, RETRY_DELAY);
};

export async function connectRabbitMQ() {
    try {
        // Using 'as any' to bypass the persistent type resolution issue.
        connection = await amqp.connect(config.rabbitmq.url) as any;

        connection.on('error', (err: Error) => {
            logger.error('RabbitMQ connection error', err);
        });

        connection.on('close', () => {
            logger.error('RabbitMQ connection closed. Reconnecting...');
            handleDisconnect();
        });

        channel = await connection.createChannel();
        logger.info('Connected to RabbitMQ');
    } catch (error) {
        logger.error('Failed to connect to RabbitMQ', error);
        handleDisconnect();
    }
}

export function getRabbitMQChannel() {
    if (!channel) {
        throw new Error('RabbitMQ channel is not available. Make sure connectRabbitMQ() is called on application startup.');
    }
    return channel;
}