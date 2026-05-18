import { SubscriptionAutoSuspendQueue } from "../queues/subscription-auto-suspend.queue";

export class SubscriptionAutoSuspendJob {
    private queue = new SubscriptionAutoSuspendQueue();

    async register() {
        const repeatables = await this.queue['queue'].getRepeatableJobs();

        for (const job of repeatables) {
            await this.queue['queue'].removeRepeatableByKey(job.key);
        }

        await this.queue.add(
            { triggeredAt: new Date().toISOString() },
            {
                repeat: {
                    cron: '0 0 * * *'
                },
                jobId: 'daily-subscription-auto-suspend',
                removeOnComplete: true
            }
        );

        console.log('[JOB] Subscription auto-suspend job registered (daily at midnight)');
    }
}

export const subscriptionAutoSuspendJob = new SubscriptionAutoSuspendJob();
