import Queue from 'bull';
import { config } from '../config';
import Console from '../utils/logger';

export const paymentQueue = new Queue('payment-expiration', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
    },
    defaultJobOptions: {
        delay: 60 * 1000,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        }
    }
});

export async function schedulePaymentExpiration(orderId: string, runAt: Date) {
    const delay = Math.max(runAt.getTime() - Date.now(), 0);

    try {
        const existingJob = await paymentQueue.getJob(orderId);
        if (existingJob) {
            await existingJob.remove();
        }

        await paymentQueue.add(
            { orderId },
            {
                jobId: orderId,
                delay,
                removeOnComplete: true,
                removeOnFail: true
            }
        );

        Console.log(`Scheduled payment expiration for order ${orderId} in ${delay}ms`);
    } catch (error) {
        Console.error(`Failed to schedule expiration job for order ${orderId}`, error);
    }
}