import { Job } from "bull";
import { BaseQueue } from "./base-queue";

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
    }

}

export const orderExpiryQueue = new OrderExpiryQueue()