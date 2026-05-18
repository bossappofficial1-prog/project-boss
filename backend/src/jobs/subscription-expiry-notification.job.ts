import { SubscriptionExpiryNotificationQueue } from "../queues/subscription-expiry-notification.queue";

export class SubscriptionExpiryNotificationJob {
    private queue = new SubscriptionExpiryNotificationQueue();

    async register() {
        const repeatables = await this.queue['queue'].getRepeatableJobs();

        for (const job of repeatables) {
            await this.queue['queue'].removeRepeatableByKey(job.key);
        }

        await this.queue.add(
            { triggeredAt: new Date().toISOString() },
            {
                repeat: {
                    cron: '0 9 * * *'
                },
                jobId: 'daily-subscription-expiry-notification',
                removeOnComplete: true
            }
        );

        console.log('[JOB] Subscription expiry notification job registered (daily at 9 AM)');
    }
}

export const subscriptionExpiryNotificationJob = new SubscriptionExpiryNotificationJob();
