import { db } from "../config/prisma";
import { DeleteExpireSystemPayment } from "../queues/delete-expire-system-payment";

export async function deletePaymentExpiry() {
    const [orderCount] = await db.$transaction([
        db.order.deleteMany({
            where: {
                OR: [
                    { paymentStatus: 'EXPIRED' },
                    { transaction: { status: 'EXPIRED' } },
                    { cancellationReason: { contains: '[SYSTEM] Payment expire', mode: 'insensitive' } }
                ]
            }
        })
    ]);

    console.log(`[Job] DeletePaymentExpiry: Deleted ${orderCount.count} expired orders and their related transactions.`);
}

export class DeletePaymentExpiryJob {
    private queue = new DeleteExpireSystemPayment()

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
                jobId: 'daily-delete-payment-expiry',
                removeOnComplete: true
            }
        )
    }
}

export const deletePaymentExpiryScheduler = new DeletePaymentExpiryJob();