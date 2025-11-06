import { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "../config/prisma";
import { getRabbitMQChannel } from "../config/rabbitmq";
import { messagePublisher } from "./message-publisher.service";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { OrderRepository } from "../repositories/order.repository";
import { CreateOrderInput } from "../schemas/order.schema";
import { createMidtransTransactionService } from './payment.service';
import { getOutletByIdService } from "./outlet.service";
import { getBusinessByIdService } from "./business.service"; // Impor service bisnis
import { BookingRepository } from "../repositories/booking.repository";
import { createOrderRecord } from "./helpers/order-create.helper";
import { PaymentRepository } from "../repositories/payment.repository";
import { SocketEmitter } from "../socket/socket-emiiter";
import { MidtransTransactionStatus, PaymentResponse } from "../types/Others";
import Console from "../utils/logger";

// List goods orders by outlet with optional status filter and pagination
export async function getGoodsOrdersByOutletService(
    outletId: string,
    ownerId: string,
    options?: { status?: OrderStatus; page?: number; limit?: number }
) {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const skip = (page - 1) * limit;

    // Ownership validation
    const outlet = await getOutletByIdService(outletId);
    const business = await getBusinessByIdService(outlet.businessId);
    if (business.ownerId !== ownerId) {
        throw new AppError("Anda tidak berhak mengakses outlet ini.", HttpStatus.FORBIDDEN);
    }

    const baseWhere = {
        outletId,
        ...(options?.status ? { orderStatus: options.status } : {}),
        items: {
            some: {
                product: { type: 'GOODS' }
            }
        }
    } as const;

    const [total, orders] = await db.$transaction([
        db.order.count({ where: baseWhere as any }),
        db.order.findMany({
            where: baseWhere as any,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                items: { include: { product: true } },
                guestCustomer: true,
                transaction: {
                    select: {
                        paymentProofUrl: true,
                    }
                }
            }
        })
    ]);

    return {
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

// List service queue by outlet (READY orders with SERVICE items), ordered by createdAt asc and position
export async function getServiceQueueByOutletService(
    outletId: string,
    ownerId: string,
    options?: { page?: number; limit?: number }
) {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 50));
    const skip = (page - 1) * limit;

    // Ownership validation
    const outlet = await getOutletByIdService(outletId);
    const business = await getBusinessByIdService(outlet.businessId);
    if (business.ownerId !== ownerId) {
        throw new AppError("Anda tidak berhak mengakses outlet ini.", HttpStatus.FORBIDDEN);
    }

    const where = {
        outletId,
        // Tampilkan antrian layanan untuk beberapa status yang relevan
        orderStatus: {
            in: [
                OrderStatus.AWAITING_PAYMENT,
                OrderStatus.PROCESSING,
                OrderStatus.READY,
                OrderStatus.CONFIRMED,
            ]
        },
        items: { some: { product: { type: 'SERVICE' } } }
    } as const;

    const [total, orders] = await db.$transaction([
        db.order.count({ where: where as any }),
        db.order.findMany({
            where: where as any,
            orderBy: { createdAt: 'asc' },
            skip,
            take: limit,
            include: {
                items: { include: { product: true } },
                guestCustomer: true,
                bookingSlot: true
            }
        })
    ]);

    const data = orders.map((o, idx) => ({
        position: skip + idx + 1,
        ...o
    }));

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}


export async function getOrderByIdService(id: string, ownerId?: string) {
    const order = await OrderRepository.findById(id);
    if (!order) {
        throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // SECURITY FIX: Validate ownership if ownerId is provided
    if (ownerId) {
        const outlet = await getOutletByIdService(order.outletId);
        const business = await getBusinessByIdService(outlet.businessId);

        if (business.ownerId !== ownerId) {
            throw new AppError("Anda tidak berhak mengakses pesanan ini.", HttpStatus.FORBIDDEN);
        }
    }

    return order;
}

export async function refundOrderService(orderId: string) {
    const order = await getOrderByIdService(orderId);

    if (order?.paymentStatus === 'REFUNDED') {
        throw new AppError("Pesanan ini sudah di-refund.", HttpStatus.BAD_REQUEST);
    }

    return db.$transaction(async (tx) => {
        // 1. Update order status
        const refundedOrder = await tx.order?.update({
            where: { id: orderId },
            data: { paymentStatus: 'REFUNDED' },
        });

        // 2. Create an expense entry for the refund
        await tx.expense.create({
            data: {
                outletId: order?.outletId,
                description: `Refund untuk pesanan #${order?.id}`,
                amount: order?.totalAmount,
                date: new Date(),
            },
        });

        return refundedOrder;
    });
}

export async function createOrderAndMidtransTransactionService(data: CreateOrderInput) {
    const { paymentMethod } = data;

    if (data.bookingSlotId) {
        const slot = await BookingRepository.getSlots(data.bookingSlotId)

        if (!slot) throw new AppError(Messages.BOOKING_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
        if (slot.status === "BOOKED") throw new AppError(Messages.BOOKING_SLOT_ALREADY_BOOKED, HttpStatus.CONFLICT);

        // Lock slot untuk mencegah race condition
        await BookingRepository.update(slot.id, { status: "BOOKED" })
    }

    // Jika payment method adalah 'cash', buat order offline tanpa Midtrans
    if (paymentMethod === 'cash') {
        const { order } = await createOrderRecord(data);

        const updatedOrder = await db.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: PaymentStatus.SUCCESS,
                orderStatus: OrderStatus.READY,
            },
        });

        return { order: updatedOrder, midtransTransaction: undefined as any };
    }

    // Default flow: gunakan Midtrans untuk pembayaran online/QRIS
    const { order, midtransFee, appFee, feeBearer, totalAmount } = await createOrderRecord(data);

    const chargeTo = feeBearer.toLowerCase() as 'customer' | 'owner';

    const midtransTransaction = await createMidtransTransactionService(order.id, totalAmount, midtransFee, appFee, paymentMethod as 'online' | 'qris', chargeTo);

    const updatedOrder = await db.order.update({
        where: { id: order.id },
        data: {
            midtransTransactionToken: midtransTransaction.token,
            midtransRedirectUrl: midtransTransaction.redirect_url,
        },
    });

    return { order: updatedOrder, midtransTransaction };
}

export async function updateOrderStatusService(orderId: string, status: OrderStatus) {
    const order = await getOrderByIdService(orderId);

    if (!order) {
        throw new Error('Order not found');
    }

    if (status === OrderStatus.PROCESSING) {
        Console.log('UPDATE TRANSACTION STATUS TO SUCCESS');

        if (order.transaction?.id) {
            await db.transaction.update({
                where: {
                    id: order.transaction.id,
                },
                data: { status: PaymentStatus.SUCCESS },
            });
        }
    }

    if (status === 'COMPLETED' && order?.bookingSlot) {
        await db.bookingSlot.update({
            where: { id: order.bookingSlot.id },
            data: { status: 'AVAILABLE' },
        });
    }

    // Update pesanan dengan include data yang diperlukan
    const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
            orderStatus: status,
            ...(status === OrderStatus.PROCESSING ? { paymentStatus: PaymentStatus.SUCCESS } : {}),
        },
        include: {
            items: {
                include: {
                    product: true
                }
            },
            outlet: true,
            guestCustomer: true,
            transaction: true,
        }
    });

    // // Kirim notifikasi status update melalui message publisher
    // await messagePublisher.publishOrderNotification(updatedOrder.id, updatedOrder.orderStatus);

    // Broadcast status update ke customer melalui socket
    try {
        const customerPhone = updatedOrder.guestCustomer?.phone;
        if (customerPhone) {
            const statusMessages: Partial<Record<OrderStatus, string>> = {
                AWAITING_PAYMENT: 'Menunggu pembayaran',
                PROCESSING: 'Pesanan sedang diproses',
                READY: 'Pesanan siap diambil',
                COMPLETED: 'Pesanan selesai',
                CANCELLED: 'Pesanan dibatalkan',
                CONFIRMED: 'Pesanan dikonfirmasi',
            };

            SocketEmitter.getInstance().emitToCustomer(customerPhone, {
                orderId: updatedOrder.id,
                amount: updatedOrder.totalAmount,
                status,
                transactionStatus: status,
                isManual: Boolean(updatedOrder.transaction?.isManual),
                paymentMethod: updatedOrder.transaction?.paymentMethod || 'unknown',
                message: statusMessages[status] ?? 'Status pesanan diperbarui',
                type: 'order_status_update'
            });
        }
    } catch (customerSocketError) {
        console.error('❌ Error emitting customer order status event:', customerSocketError);
    }

    // Jika status diubah menjadi COMPLETED dan ini adalah pesanan layanan
    if (status === 'COMPLETED' && updatedOrder.items.some(item => item.product.type === 'SERVICE')) {
        // Dapatkan antrian untuk outlet yang sama
        const queuedOrders = await db.order.findMany({
            where: {
                outletId: updatedOrder.outletId,
                orderStatus: OrderStatus.READY,
                items: {
                    some: {
                        product: {
                            type: 'SERVICE'
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                guestCustomer: true
            }
        });

        // Update posisi antrian untuk semua pesanan yang tersisa
        for (let i = 0; i < queuedOrders.length; i++) {
            const queuedOrder = queuedOrders[i];
            if (queuedOrder.guestCustomer?.phone) {
                const channel = getRabbitMQChannel();
                await channel.publish(
                    'notification_exchange',
                    '',
                    Buffer.from(JSON.stringify({
                        type: 'queue_position',
                        data: {
                            phone: queuedOrder.guestCustomer.phone,
                            position: i + 1,
                        }
                    })),
                    { persistent: true }
                );
            }
        }
    }

    return updatedOrder;
}

export async function completeServiceOrderService(orderId: string) {
    // 1. Update status pesanan menjadi COMPLETED
    const completedOrder = await db.order.update({
        where: { id: orderId },
        data: { orderStatus: OrderStatus.COMPLETED },
        include: {
            items: { include: { product: true } },
            outlet: true
        }
    });

    // 2. Periksa apakah pesanan yang selesai adalah pesanan layanan
    const hasServiceProduct = completedOrder.items.some(item => item.product.type === 'SERVICE');

    // 3. Jika ya, picu ulang pengecekan antrian untuk outlet tersebut
    if (hasServiceProduct) {
        // Dapatkan daftar pesanan dalam antrian untuk outlet ini
        const queuedOrders = await db.order.findMany({
            where: {
                outletId: completedOrder.outletId,
                orderStatus: OrderStatus.READY,
                items: {
                    some: {
                        product: {
                            type: 'SERVICE'
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                guestCustomer: true
            }
        });

        // Publish message untuk mengecek ulang antrian
        await messagePublisher.publishServiceOrderRecheck(completedOrder.id);

        // Kirim notifikasi ke pesanan berikutnya dalam antrian jika ada
        if (queuedOrders.length > 0) {
            const nextOrder = queuedOrders[0];
            if (nextOrder.guestCustomer?.phone) {
                // Kirim notifikasi bahwa giliran mereka sudah dekat
                const channel = getRabbitMQChannel();
                await channel.publish(
                    'notification_exchange',
                    '',
                    Buffer.from(JSON.stringify({
                        type: 'queue_position',
                        data: {
                            phone: nextOrder.guestCustomer.phone,
                            position: 1,
                        }
                    })),
                    { persistent: true }
                );
            }
        }
    }

    return completedOrder;
}

export async function getOrderByCustomerPhoneService(phone: string) {
    const customerOrder = await OrderRepository.getOrderByCustomerPhone(phone)

    if (!customerOrder || customerOrder.length === 0) throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);

    const customerOrderMap = customerOrder.map((order) => {
        const { guestCustomer, ...otherOrder } = order

        return {
            ...otherOrder,
            customerDetails: guestCustomer
        }
    })

    return customerOrderMap
}

export async function expirePaymentOrder(orderId: string) {
    const order = await OrderRepository.findById(orderId);

    if (!order) throw new AppError(`Order: ${orderId} NOT FOUND`);

    if (order.transaction && order.transaction.status !== 'PENDING' && order.paymentStatus !== 'PENDING') {
        console.log(`Payment ${orderId} is already ${order.transaction.status}, skipping expiration`);
        return;
    };

    await PaymentRepository.updatePaymentStatusByOrder(orderId, `EXPIRED`);
    SocketEmitter.getInstance().sendTestMessage(order.outletId, 'Expire Payment')
    SocketEmitter.getInstance().emitToCustomer(order.guestCustomer.phone!, {
        orderId,
        amount: order.totalAmount,
        status: 'expired',
        transactionStatus: 'expired',
        paymentMethod: order.transaction?.paymentMethod || 'unknown',
        isManual: order.transaction?.isManual || false,
        message: 'Pembayaran kedaluwarsa',
        type: 'payment_expired'
    });
}

export async function getOrderDetailsService(orderId: string) {
    const order = await OrderRepository.findById(orderId);

}

export const orderMapping = (order: Awaited<ReturnType<typeof OrderRepository.findById>>) => {
    const { guestCustomer, transaction, items, outlet, bookingSlot, ...restOrder } = order!

    return {

    }
}