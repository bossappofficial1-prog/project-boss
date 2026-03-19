import { CleanupFile } from "../queues/cleanup.queue";

export class CleanJob {
    private queue = new CleanupFile()

    async register() {
        const repeatables = await this.queue['queue'].getRepeatableJobs();

        for (const job of repeatables) {
            await this.queue['queue'].removeRepeatableByKey(job.key)
        }

        await this.queue.add(
            { triggeredAt: new Date().toISOString() },
            {
                repeat: {
                    cron: '0 0 1 */2 *'
                },
                jobId: 'monthly-cleanup-job',
                removeOnComplete: true
            }
        )
    }
}

export const cleanupScheduler = new CleanJob();