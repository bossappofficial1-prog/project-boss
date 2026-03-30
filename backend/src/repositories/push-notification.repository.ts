import { db } from "../config/prisma";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { PushSubscriptionPayload } from "../schemas/push-notification.schema";

export class PushNotificationRepository {
    public async subscribe(data: PushSubscriptionPayload) {
        const customer = await this.findCustomerbyPhone(data.guestPhone)

        return db.pushSubscription.upsert({
            where: {
                endpoint: data.subscription.endpoint
            },
            update: {
                guestCustomerId: customer.id,
                p256dh: data.subscription.keys.p256dh,
                auth: data.subscription.keys.auth
            },
            create: {
                endpoint: data.subscription.endpoint,
                p256dh: data.subscription.keys.p256dh,
                auth: data.subscription.keys.auth,
                guestCustomerId: customer.id
            }
        })
    }

    public async findCustomerbyPhone(phone?: string) {
        const result = await db.guestCustomer.findUnique({ where: { phone } })
        if (!result) throw new AppError(`Customer tidak ditemukan.`, HttpStatus.NOT_FOUND);

        return result
    }

    public async delete(id: string) {
        return db.pushSubscription.delete({ where: { id } })
    }

    public async deleteByEndpoint(endpoint: string) {
        try {
            return await db.pushSubscription.delete({
                where: { endpoint }
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                console.log(`Customer belum pernah mengaktifkan notifikasi`);
                return null;
            }
            throw error;
        }
    }

    public async getCustomerOrder(orderID: string) {
        const order = await db.order.findUnique({
            where: { id: orderID },
            select: {
                id: true,
                totalAmount: true,
                guestCustomer: {
                    select: {
                        pushSubscriptions: true
                    }
                }
            }
        })
        if (!order) throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);

        return order
    }
}