import Queue from 'bull';
import { config } from '../config';
import Console from '../utils/logger';

export const paymentProofCleanupQueue = new Queue('payment-proof-cleanup', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
    },
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
    },
});

export async function scheduleDailyPaymentProofCleanup() {
    try {
        await paymentProofCleanupQueue.add(
            'daily-cleanup',
            {},
            {
                jobId: 'daily-payment-proof-cleanup',
                repeat: {
                    cron: '0 0 * * *',
                    tz: 'Asia/Jakarta',
                },
            },
        );
        Console.log('Scheduled daily payment proof cleanup job at 00:00 Asia/Jakarta');
    } catch (error) {
        Console.error('Failed to schedule payment proof cleanup job', error);
    }
}
