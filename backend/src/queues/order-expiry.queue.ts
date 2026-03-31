import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { expirePaymentOrder } from "../service/order.service";
import Console from "../utils/logger";
import { PushNotificationService } from "../service/push-notification.service";
import { PushNotificationRepository } from "../repositories/push-notification.repository";
import { StringUtil } from "../utils";

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
        const orderID = job.data.orderId;
        console.log('Memproses job untuk', orderID)
        try {
            const pushNotificationRepo = new PushNotificationRepository()
            const pushNotificationService = new PushNotificationService(pushNotificationRepo)
            const order = await pushNotificationRepo.getCustomerOrder(orderID)

            Promise.all([
                await expirePaymentOrder(orderID),
                pushNotificationService.sendNotificationToCustomer(orderID, order, {
                    title: 'Pembayaran Berakhir!',
                    body: `Pesanan senilai Rp${StringUtil.formatCurrency(order.totalAmount)} sudah berakhir.`,
                    url: `/payment/${order.id}`
                })
            ])
        }
        catch (error) { Console.log(error) }
    }

    async removeJob(jobId: string): Promise<void> {
        const job = await this.queue.getJob(jobId)
        if (job) await job.remove()
    }

}

export const orderExpiryQueue = new OrderExpiryQueue()