import { CheckSubscriptionExpire } from "../queues/check-subscriptioin-expire";

export class CheckSubscriptionExpireJob {
    private queue = new CheckSubscriptionExpire()

    async register() {
        const repeatables = await this.queue['queue'].getRepeatableJobs();

        for (const job of repeatables) {
            await this.queue['queue'].removeRepeatableByKey(job.key)
        }

        await this.queue.add(
            { triggeredAt: new Date().toISOString() },
            {
                repeat: {
                    cron: '0 0 * * *'
                },
                jobId: 'daily-check-subscription-expire',
                removeOnComplete: true
            }
        )
    }
}

export const checkSubscriptionExpireJob = new CheckSubscriptionExpireJob();