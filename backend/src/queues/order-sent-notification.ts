import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { expirePaymentOrder } from "../service/order.service";
import Console from "../utils/logger";
import { PushNotificationService } from "../service/push-notification.service";
import { PushNotificationRepository } from "../repositories/push-notification.repository";

export type OrderSentNotificationDTO = {
    orderId: string
}

export class OrderNotificationQueue extends BaseQueue<OrderSentNotificationDTO> {

    constructor() {
        super('payment-notification-queue')

        this.queue.on('active', job => {
            console.log('[PAYMENT_NOTIFICATION_QUEUE] Active', job.data.orderId)
        })

        this.queue.on('completed', job => {
            console.log('[PAYMENT_NOTIFICATION_QUEUE] Done', job.data.orderId)
        })
    }

    protected async handle(job: Job<OrderSentNotificationDTO>): Promise<void> {
        const orderID = job.data.orderId;
        console.log('Memproses job untuk', orderID)
        try {
            const pushNotificationRepo = new PushNotificationRepository()
            const pushNotificationService = new PushNotificationService(pushNotificationRepo)
            const order = await pushNotificationRepo.getCustomerOrder(orderID)

            pushNotificationService.sendNotificationToCustomer(orderID, order, {
                title: 'Pembayaran Segera Berakhir! ⏳',
                body: `Pesanan senilai Rp${order.totalAmount} menunggu pembayaran. Selesaikan sebelum dibatalkan otomatis.`,
                url: `/payment/${order.id}`
            })
        }
        catch (error) { Console.log(error) }
    }

    async removeJob(jobId: string): Promise<void> {
        const job = await this.queue.getJob(jobId)
        if (job) await job.remove()
    }

}

export const orderNotificationQueue = new OrderNotificationQueue()