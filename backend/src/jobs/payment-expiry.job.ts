import { orderExpiryQueue } from "../queues/order-expiry.queue";

export class OrderExpiryJob {
    private queue = orderExpiryQueue

    async add(orderId: string) {
        this.queue.add({ orderId }, {
            delay: 1 * 60 * 1000,
            jobId: `payment-expiry-${orderId}`,
            removeOnComplete: true
        })
    }
}

export const orderExpiryJob = new OrderExpiryJob()
