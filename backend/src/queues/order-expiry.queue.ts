import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { expirePaymentOrder } from "../service/order.service";
import Console from "../utils/logger";

export type OrderExpiryDTO = {
    orderId: string
}

export class OrderExpiryQueue extends BaseQueue<OrderExpiryDTO> {

    constructor() {
        super('payment-expiry-queue')

        this.queue.on('active', job => {
            console.log('[PAYMENT_EXPIRY_QUEUE] Active', job.data.orderId)
        })

        this.queue.on('completed', job => {
            console.log('[PAYMENT_EXPIRY_QUEUE] Done', job.data.orderId)
        })
    }

    protected async handle(job: Job<OrderExpiryDTO>): Promise<void> {
        console.log('Memproses job untuk', job.data.orderId)
        try { await expirePaymentOrder(job.data.orderId) }
        catch (error) { Console.log(error) }
    }

    async removeJob(jobId: string): Promise<void> {
        const job = await this.queue.getJob(jobId)
        if (job) await job.remove()
    }

}

export const orderExpiryQueue = new OrderExpiryQueue()