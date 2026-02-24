import { orderExpiryQueue } from "../queues/order-expiry.queue";

export class OrderExpiryJob {
    private queue = orderExpiryQueue

    private jobId(orderId: string) {
        return `payment-expiry-${orderId}`
    }

    async add(orderId: string) {
        this.queue.add({ orderId }, {
            delay: 10 * 60 * 1000,
            jobId: this.jobId(orderId),
            removeOnComplete: true
        })
    }

    async remove(orderId: string) {
        await this.queue.removeJob(this.jobId(orderId))
    }
}

export const orderExpiryJob = new OrderExpiryJob()
