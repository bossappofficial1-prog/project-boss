import amqp, { Connection, Channel } from 'amqplib';

interface RabbitMQConfig {
    url: string;
    exchanges: string[];
    queues: string[];
}

const config: RabbitMQConfig = {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchanges: ['main_exchange', 'notification_exchange'],
    queues: ['task_queue', 'email_queue', 'notification_queue']
};

let connection: any | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<void> => {
    try {
        connection = await amqp.connect(config.url);
        channel = await connection.createChannel();

        // Setup exchanges
        for (const exchange of config.exchanges) {
            await channel?.assertExchange(exchange, 'topic', { durable: true });
        }

        // Setup queues
        for (const queue of config.queues) {
            await channel?.assertQueue(queue, { durable: true });
        }

        console.log('RabbitMQ connected successfully');

        // Handle connection errors
        connection.on('error', (err: any) => {
            console.error('RabbitMQ connection error:', err);
        });

        connection.on('close', () => {
            console.log('RabbitMQ connection closed');
            connection = null;
            channel = null;
        });

    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

export const getChannel = (): Channel => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized. Call connectRabbitMQ() first.');
    }
    return channel;
};

export const getConnection = (): Connection => {
    if (!connection) {
        throw new Error('RabbitMQ connection not initialized. Call connectRabbitMQ() first.');
    }
    return connection;
};

export const publishMessage = async (
    exchange: string,
    routingKey: string,
    message: any,
    options: any = {}
): Promise<void> => {
    try {
        const ch = getChannel();
        const messageBuffer = Buffer.from(JSON.stringify(message));

        await ch.publish(exchange, routingKey, messageBuffer, {
            persistent: true,
            ...options
        });

        console.log(`Message published to ${exchange} with key ${routingKey}`);
    } catch (error) {
        console.error('Failed to publish message:', error);
        throw error;
    }
};

export const consumeMessage = async (
    queue: string,
    callback: (message: any) => Promise<void>
): Promise<void> => {
    try {
        const ch = getChannel();

        await ch.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    await callback(content);
                    ch.ack(msg);
                } catch (error) {
                    console.error('Error processing message:', error);
                    ch.nack(msg, false, false); // Reject message
                }
            }
        });

        console.log(`Started consuming messages from queue: ${queue}`);
    } catch (error) {
        console.error('Failed to consume message:', error);
        throw error;
    }
};

export const closeRabbitMQ = async (): Promise<void> => {
    try {
        if (channel) {
            await channel.close();
            channel = null;
        }
        if (connection) {
            await connection.close();
            connection = null;
        }
        console.log('RabbitMQ connection closed');
    } catch (error) {
        console.error('Error closing RabbitMQ connection:', error);
    }
};

// Utility functions
export const bindQueueToExchange = async (
    queue: string,
    exchange: string,
    routingKey: string
): Promise<void> => {
    try {
        const ch = getChannel();
        await ch.bindQueue(queue, exchange, routingKey);
        console.log(`Queue ${queue} bound to exchange ${exchange} with routing key ${routingKey}`);
    } catch (error) {
        console.error('Failed to bind queue to exchange:', error);
        throw error;
    }
};

export const purgeQueue = async (queue: string): Promise<void> => {
    try {
        const ch = getChannel();
        await ch.purgeQueue(queue);
        console.log(`Queue ${queue} purged`);
    } catch (error) {
        console.error('Failed to purge queue:', error);
        throw error;
    }
};