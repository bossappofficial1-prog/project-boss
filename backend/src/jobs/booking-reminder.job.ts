import { BookingReminderQueue } from "../queues/booking-reminder.queue";

export class BookingReminderJob {
    private queue = new BookingReminderQueue();

    async register() {
        const repeatables = await this.queue['queue'].getRepeatableJobs();

        for (const job of repeatables) {
            await this.queue['queue'].removeRepeatableByKey(job.key);
        }

        await this.queue.add(
            { triggeredAt: new Date().toISOString() },
            {
                repeat: {
                    cron: '*/15 * * * *' // Jalankan setiap 15 menit
                },
                jobId: 'recurring-booking-reminder',
                removeOnComplete: true
            }
        );
    }
}

export const bookingReminderJob = new BookingReminderJob();
