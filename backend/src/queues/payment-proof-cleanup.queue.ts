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
        const existing = await paymentProofCleanupQueue.getRepeatableJobs();
        const sameNameJobs = existing.filter(j => j.name === 'daily-cleanup');
        for (const j of sameNameJobs) {
            // Remove any job with the same name but not the same expected jobId or cron
            const isSameId = j.id === 'daily-payment-proof-cleanup';
            const isSameCron = (j.cron || j.every) === '0 0 * * *';
            if (!isSameId || !isSameCron) {
                try {
                    await paymentProofCleanupQueue.removeRepeatableByKey(j.key);
                    Console.log(`Removed old repeatable job with key ${j.key}`);
                } catch (err) {
                    Console.warn(`Failed to remove old repeatable job ${j.key}`, err);
                }
            }
        }

        const jobExists = await paymentProofCleanupQueue.getRepeatableJobs();
        if (jobExists.some(j => j.id === 'daily-payment-proof-cleanup' && j.name === 'daily-cleanup')) {
            Console.log('Daily payment proof cleanup job already scheduled; skipping creating duplicate.');
            Console.log('Existing repeatable jobs for payment-proof-cleanup:', jobExists);
            return;
        }
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
