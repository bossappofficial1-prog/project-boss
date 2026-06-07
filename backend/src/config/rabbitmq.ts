import * as amqp from 'amqplib';
import { config } from '.';
import logger from '../utils/pino.logger';

let channel: amqp.Channel;
let connection: amqp.Connection | any;

const RETRY_DELAY = 5000; // 5 seconds

type OnConnectCallback = (channel: amqp.Channel) => void;
let onConnectCallback: OnConnectCallback | null = null;

export function onRabbitMQConnect(callback: OnConnectCallback) {
    onConnectCallback = callback;
}

const handleDisconnect = () => {
    logger.info(`Retrying RabbitMQ connection in ${RETRY_DELAY / 1000} seconds...`);
    setTimeout(connectRabbitMQ, RETRY_DELAY);
};

export async function connectRabbitMQ(): Promise<boolean> {
    try {
        // Using 'as any' to bypass the persistent type resolution issue.
        connection = await amqp.connect(config.rabbitmq.url) as any;

        connection.on('error', (err: Error) => {
            logger.error('RabbitMQ connection error', err);
            (channel as any) = null;
            connection = null;
        });

        connection.on('close', () => {
            logger.error('RabbitMQ connection closed. Reconnecting...');
            (channel as any) = null;
            connection = null;
            handleDisconnect();
        });

        channel = await connection.createChannel();
        logger.info('Connected to RabbitMQ');

        if (onConnectCallback) {
            onConnectCallback(channel);
        }

        return true;
    } catch (error) {
        logger.error('Failed to connect to RabbitMQ', error);
        (channel as any) = null;
        connection = null;
        handleDisconnect();
        return false;
    }
}

export function getRabbitMQChannel() {
    if (!channel) {
        throw new Error('RabbitMQ channel is not available. Make sure connectRabbitMQ() is called on application startup.');
    }
    return channel;
}