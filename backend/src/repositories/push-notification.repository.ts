import { db } from "../config/prisma";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { PushSubscriptionPayload } from "../schemas/push-notification.schema";

export class PushNotificationRepository {
    public async subscribe(data: PushSubscriptionPayload) {
        let guestCustomerId: string | null = null;
        let staffId: string | null = null;
        let userId: string | null = null;

        if (data.guestPhone) {
            const customer = await this.findCustomerbyPhone(data.guestPhone, data.guestName || 'Customer');
            guestCustomerId = customer.id;
        } else if (data.staffId) {
            staffId = data.staffId;
        } else if (data.userId) {
            userId = data.userId;
        }

        return db.pushSubscription.upsert({
            where: {
                endpoint: data.subscription.endpoint
            },
            update: {
                guestCustomerId,
                staffId,
                userId,
                p256dh: data.subscription.keys.p256dh,
                auth: data.subscription.keys.auth
            },
            create: {
                endpoint: data.subscription.endpoint,
                p256dh: data.subscription.keys.p256dh,
                auth: data.subscription.keys.auth,
                guestCustomerId,
                staffId,
                userId
            }
        })
    }

    public async getStaffSubscriptionsByOutlet(outletId: string) {
        return db.pushSubscription.findMany({
            where: {
                staffId: { not: null },
                staff: {
                    outletId: outletId
                }
            }
        });
    }

    public async findCustomerbyPhone(phone: string, name: string) {
        let result = await db.guestCustomer.findUnique({ where: { phone } })
        if (!result) {
            result = await db.guestCustomer.create({
                data: { phone, name: name || 'Customer' }
            })
        };

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