import { PaymentStatus, OrderStatus } from '@prisma/client';
import { db } from '../config/prisma';
import { HttpStatus } from '../constants/http-status';
import { AppError } from '../errors/app-error';
import { messagePublisher } from './message-publisher.service';
import { SocketEmitter } from '../socket/socket-emiiter';
import { MidtransWebhookPayloadType } from '../types/Others';
import { OperatingHoursRepository } from '../repositories/operating-hours.repository';
import { generateTicketCode } from '../utils/code-generator';

export async function handlePaymentSuccess(orderId: string) {
    let order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            items: { include: { product: { include: { ticket: true } }, bookingSlot: true } },
            outlet: true,
            guestCustomer: true,
            transaction: true
        },
    });

    if (!order) {
        throw new AppError("Order not found", HttpStatus.NOT_FOUND);
    }

    if (order.paymentStatus === 'SUCCESS') {
        console.log(`Payment for order ${orderId} has already been processed. Skipping.`);
        return;
    }
    let orderStatus: OrderStatus = order.orderStatus as OrderStatus;
    const bookingSlotItem = order.items.find((item: any) => item.bookingSlot);
    const bookingSlot = (bookingSlotItem as any)?.bookingSlot;
    if (bookingSlot) {
        orderStatus = OrderStatus.PROCESSING;
        await db.bookingSlot.update({
            where: { id: bookingSlot.id },
            data: { status: 'BOOKED' },
        });
        await messagePublisher.publishServiceOrderProcessing(order.id);
    } else if (order.items.some(item => item.product.type === 'SERVICE')) {
        orderStatus = OrderStatus.PROCESSING;
        await messagePublisher.publishServiceOrderProcessing(order.id);
    } else {
        orderStatus = OrderStatus.READY;
    }

    // Gunakan transaksi Prisma untuk memastikan semua pembaruan berhasil atau tidak sama sekali
    if (orderId !== 'TEST123') {
        await db.$transaction(async (tx) => {
            // 2. Perbarui status pesanan
            await tx.order.update({
                where: { id: orderId },
                data: { paymentStatus: PaymentStatus.SUCCESS, orderStatus },
            });

            // 2b. Update status transaksi jika tersedia
            await tx.transaction.updateMany({
                where: { orderId },
                data: { status: PaymentStatus.SUCCESS },
            });

            // 4. Kurangi stock produk untuk GOODS
            for (const item of order.items) {
                if (item.product.type === 'GOODS') {
                    await tx.productGoods.update({
                        where: { productId: item.productId },
                        data: { currentStock: { decrement: item.quantity } },
                    });
                }
            }

            // 5. Generate TicketCode untuk TICKET items
            for (const item of order.items) {
                if (item.product.type === 'TICKET' && item.product.ticket) {
                    const ticketCodes = Array.from({ length: item.quantity }, () => ({
                        code: generateTicketCode(),
                        orderItemId: item.id,
                        productTicketId: item.product.ticket!.id,
                        status: 'VALID' as const,
                    }));
                    await tx.ticketCode.createMany({ data: ticketCodes });
                }
            }

            // Logika booking slot jika ada
            if (bookingSlot) {
                await tx.bookingSlot.update({
                    where: { id: bookingSlot.id },
                    data: { status: 'BOOKED' },
                });
            }
        });
    } else {
        console.log('🧪 Skipping database operations for test order');
    }

    // Mutasi objek order lokal agar konsisten dengan database
    order.orderStatus = orderStatus;
    order.paymentStatus = PaymentStatus.SUCCESS;

    // Terbitkan event setelah transaksi database selesai
    await messagePublisher.publishOrderStatusUpdate(order.id, orderStatus);

    // Kirim notifikasi WhatsApp terpadu untuk pembayaran berhasil dan status pesanan
    try {
        await messagePublisher.publishWhatsAppPaymentAndOrderUpdate(order.id, orderStatus);
        console.log(`✅ Published consolidated WhatsApp notification for order ${order.id} with status ${orderStatus}`);
    } catch (whatsappError) {
        console.error('❌ Error publishing WhatsApp notification:', whatsappError);
        // Don't fail the payment process if WhatsApp notification fails
    }

    try {
        const outletId = order.outlet.id;
        if (!outletId) {
            console.warn(`⚠️ Unable to emit payment_success event because outlet ${order.outlet?.name ?? ''} has no id`);
        } else {
            SocketEmitter.getInstance().emitToBusinessOutlet(outletId, {
                type: 'payment_success',
                orderId: order.id,
                amount: order.totalAmount!,
                customerName: order.guestCustomer?.name || 'Customer',
                paymentMethod: order.transaction?.paymentMethod || "unknown",
                timestamp: new Date()
            });
            console.log(`📡 Emitted payment_success event for outlet ${outletId}`);
        }
    } catch (socketError) {
        console.error('❌ Error emitting payment_success event:', socketError);
    }

    try {
        const customerPhone = order.guestCustomer?.phone;
        if (customerPhone) {
            // Check if order was placed outside operating hours
            const operatingHours = await OperatingHoursRepository.findByOutletId(order.outlet.id);
            const now = new Date();
            const currentDay = now.getDay();
            const todaySchedule = operatingHours.find(oh => oh.dayOfWeek === currentDay);

            let isWithinOperatingHours = false;
            let outletOpenTime: string | null = null;
            if (todaySchedule && todaySchedule.isOpen) {
                const openTime = new Date(todaySchedule.openTime);
                const closeTime = new Date(todaySchedule.closeTime);
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const openMinutes = openTime.getHours() * 60 + openTime.getMinutes();
                const closeMinutes = closeTime.getHours() * 60 + closeTime.getMinutes();
                isWithinOperatingHours = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
                outletOpenTime = `${String(openTime.getHours()).padStart(2, '0')}:${String(openTime.getMinutes()).padStart(2, '0')}`;
            }

            const operatingHoursMessage = !isWithinOperatingHours && outletOpenTime
                ? `Pembayaran berhasil! Pesanan akan dikonfirmasi saat jam operasional outlet (buka pukul ${outletOpenTime}).`
                : 'Pembayaran berhasil diproses';

            SocketEmitter.getInstance().emitToCustomer(customerPhone, {
                orderId: order.id,
                amount: order.totalAmount!,
                status: 'settlement',
                transactionStatus: 'settlement',
                isManual: Boolean(order.transaction?.isManual),
                paymentMethod: order.transaction?.paymentMethod || 'unknown',
                message: operatingHoursMessage,
                type: 'payment_success',
            });
            console.log(`📡 Emitted customer payment_success event for ${customerPhone}`);
        }
    } catch (customerSocketError) {
        console.error('❌ Error emitting customer payment_success event:', customerSocketError);
    }
}


export async function handlePaymentFailure(orderId: string) {
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    product: {
                        include: { goods: true, ticket: true },
                    },
                    bookingSlot: true,
                    ticketCodes: true,
                },
            },
            outlet: true,
            guestCustomer: true,
            transaction: true,
        },
    });

    if (!order) {
        throw new AppError("Order not found", HttpStatus.NOT_FOUND);
    }
    if (order.paymentStatus !== 'PENDING') {
        // Idempotency: Jika statusnya bukan PENDING, berarti sudah diproses (gagal/sukses).
        // Jangan proses ulang.
        console.log(`Payment for order ${orderId} is not in PENDING state. Skipping failure update.`);
        return;
    }

    await db.$transaction(async (tx) => {
        for (const item of order.items) {
            if (item.product.type === "GOODS" && (item.product as any).goods) {
                await tx.productGoods.update({
                    where: { id: (item.product as any).goods.id },
                    data: { currentStock: { increment: item.quantity } },
                });
            }

            if (item.product.type === "TICKET" && (item.product as any).ticket) {
                await tx.productTicket.update({
                    where: { id: (item.product as any).ticket.id },
                    data: { soldCount: { decrement: item.quantity } },
                });
                await tx.ticketCode.updateMany({
                    where: { orderItemId: item.id },
                    data: { status: "CANCELLED" },
                });
            }

            if (item.bookingSlot) {
                await tx.bookingSlot.update({
                    where: { id: item.bookingSlot.id },
                    data: { status: 'AVAILABLE' },
                });
            }
        }

        await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' },
        });
    });

    // Emit notification to business outlet
    try {
        SocketEmitter.getInstance().emitToBusinessOutlet(order.outletId, {
            type: 'payment_failed',
            orderId: order.id,
            amount: order.totalAmount,
            customerName: order.guestCustomer?.name || 'Customer',
            timestamp: new Date(),
            paymentMethod: order.transaction?.paymentMethod || 'unknown'
        });
        console.log(`📡 Emitted payment_failed event for outlet ${order.outletId}`);
    } catch (socketError) {
        console.error('❌ Error emitting payment_failed event:', socketError);
    }

    try {
        const customerPhone = order.guestCustomer?.phone;
        if (customerPhone) {
            SocketEmitter.getInstance().emitToCustomer(customerPhone, {
                orderId: order.id,
                amount: order.totalAmount,
                status: 'failure',
                transactionStatus: 'failure',
                isManual: Boolean(order.transaction?.isManual),
                paymentMethod: order.transaction?.paymentMethod || 'unknown',
                message: 'Pembayaran gagal diproses',
                type: 'payment_failed'
            });
            console.log(`📡 Emitted customer payment_failed event for ${customerPhone}`);
        }
    } catch (customerSocketError) {
        console.error('❌ Error emitting customer payment_failed event:', customerSocketError);
    }
}

export async function processMidtransPaymentNotification(payload: MidtransWebhookPayloadType) {
    const orderId = payload.order_id;
    const rawStatus = payload.transaction_status;

    if (!orderId || !rawStatus) {
        console.warn('⚠️ Missing order_id or transaction_status in Midtrans payload, skipping processing');
        return;
    }

    const status = rawStatus.toLowerCase();

    const isSuccessfulCapture = status === 'capture'
        ? payload.fraud_status?.toLowerCase() !== 'challenge'
        : false;

    if (status === 'settlement' || isSuccessfulCapture) {
        await handlePaymentSuccess(orderId);
        return;
    }

    if (['cancel', 'deny', 'expire', 'failure'].includes(status)) {
        await handlePaymentFailure(orderId);
    }
}
