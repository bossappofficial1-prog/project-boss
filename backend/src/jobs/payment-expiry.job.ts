import { Time } from "../constants/time";
import { orderExpiryQueue } from "../queues/order-expiry.queue";
import { orderNotificationJob } from "./payment-notification.job";

export class OrderExpiryJob {
    private queue = orderExpiryQueue

    private jobId(orderId: string) {
        return `payment-expiry-${orderId}`
    }

    async add(orderId: string) {
        console.log(Time.PAYMENT_NOTIFICATION_DELAY_MS)
        this.queue.add({ orderId }, {
            delay: Time.PAYMENT_EXPIRY_TIME_MS,
            jobId: this.jobId(orderId),
            removeOnComplete: true
        })
    }

    async remove(orderId: string) {
        await this.queue.removeJob(this.jobId(orderId))
        try {
            await orderNotificationJob.remove(orderId)
        } catch (err) {
            // don't throw — ensure expiry removal doesn't fail if notification removal has issues
            console.warn(`Failed to remove notification job for ${orderId}:`, err)
        }
    }
}

export const orderExpiryJob = new OrderExpiryJob()
