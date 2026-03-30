import webpush from "../config/webpush";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { PushNotificationRepository } from "../repositories/push-notification.repository";
import { PushSubscriptionPayload } from "../schemas/push-notification.schema";

export class PushNotificationService {
    constructor(private readonly repo: PushNotificationRepository) { }

    public async subscribe(data: PushSubscriptionPayload) {
        const result = await this.repo.subscribe(data)

        if (!result) throw new AppError(Messages.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);

        return result
    }

    public async unsubscribe(endpoint: string) {
        const result = await this.repo.deleteByEndpoint(endpoint)

        if (!result) return;

        return result
    }

    public async sendNotificationToCustomer(orderID: string, order: {
        id: string;
        totalAmount: number;
        guestCustomer: {
            pushSubscriptions: {
                id: string;
                guestCustomerId: string | null;
                createdAt: Date;
                updatedAt: Date;
                endpoint: string;
                p256dh: string;
                auth: string;
                userId: string | null;
                staffId: string | null;
            }[];
        };
    }, payload: {
        title: string,
        body: string,
        url: string
    }) {
        try {
            const subcriptions = order.guestCustomer.pushSubscriptions;

            if (order.guestCustomer.pushSubscriptions.length === 0) throw new AppError(`Customer tidak mengaktifkan notifikasi`, HttpStatus.BAD_REQUEST);

            const payloadParse = JSON.stringify(payload);

            const sendPromises = subcriptions.map(async (subDb) => {
                const pushSubFormat = {
                    endpoint: subDb.endpoint,
                    keys: {
                        p256dh: subDb.p256dh,
                        auth: subDb.auth
                    }
                }

                try {
                    await webpush.sendNotification(pushSubFormat, payloadParse)
                } catch (err: any) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log(`Menghapus subscription yang sudah tidak valid: ${subDb.id}`);
                        await this.repo.delete(subDb.id);
                    } else {
                        console.error('Gagal kirim ke satu device:', err);
                    }
                }
            })

            await Promise.all(sendPromises)
        } catch (error) {
            console.log(error)
            return
        }
    }
}