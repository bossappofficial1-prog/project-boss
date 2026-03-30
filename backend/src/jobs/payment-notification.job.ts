import { Time } from "../constants/time";
import { orderNotificationQueue } from "../queues/order-sent-notification";

export class OrderNotificationJob {
    private queue = orderNotificationQueue

    private jobId(orderId: string) {
        return `payment-notification-${orderId}`
    }

    async add(orderId: string) {
        this.queue.add({ orderId }, {
            delay: Time.PAYMENT_NOTIFICATION_DELAY_MS,
            jobId: this.jobId(orderId),
            removeOnComplete: true
        })
    }

    async remove(orderId: string) {
        await this.queue.removeJob(this.jobId(orderId))
    }
}

export const orderNotificationJob = new OrderNotificationJob()
