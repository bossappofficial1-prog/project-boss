import { db } from '../config/prisma';
import { HttpStatus } from '../constants/http-status';
import { AppError } from '../errors/app-error';
import { messagePublisher } from './message-publisher.service';
import { socketUtils } from '../utils/socket.utils';
import { OrderStatus } from '@prisma/client';

export async function handlePaymentSuccess(orderId: string) {
    let order;

    // Bypass untuk test WhatsApp notification
    if (orderId === 'TEST123') {
        console.log('🧪 Using mock order data for WhatsApp test');
        order = {
            id: 'TEST123',
            paymentStatus: 'PENDING',
            orderStatus: 'PENDING',
            outlet: {
                businessId: 'test-business',
                name: 'Test Outlet'
            },
            guestCustomer: {
                name: 'Test Customer',
                phone: '+6283180541892' // Nomor WhatsApp test
            },
            items: [],
            bookingSlot: null
        };
    } else {
        order = await db.order.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { product: true } },
                bookingSlot: true,
                outlet: true,
                guestCustomer: true,
            },
        });

        if (!order) {
            throw new AppError("Order not found", HttpStatus.NOT_FOUND);
        }
    }

    if (order.paymentStatus === 'SUCCESS') {
        console.log(`Payment for order ${orderId} has already been processed. Skipping.`);
        return;
    }
    let orderStatus: OrderStatus = order.orderStatus as OrderStatus;
    if (order.bookingSlot) {
        orderStatus = OrderStatus.CONFIRMED;
        await db.bookingSlot.update({
            where: { id: order.bookingSlot.id },
            data: { status: 'BOOKED' },
        });
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
                data: { paymentStatus: 'SUCCESS', orderStatus },
            });

            // 3. Perbarui saldo dompet bisnis
            await tx.wallet.update({
                where: { businessId: order.outlet.businessId },
                data: {
                    balance: {
                        increment: order.totalAmount,
                    },
                },
            });

            // 4. Kurangi quantity produk untuk GOODS
            for (const item of order.items) {
                if (item.product.type === 'GOODS') {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { quantity: { decrement: item.quantity } },
                    });
                }
            }

            // Logika booking slot jika ada
            if (order.bookingSlot) {
                await tx.bookingSlot.update({
                    where: { id: order.bookingSlot.id },
                    data: { status: 'BOOKED' },
                });
            }
        });
    } else {
        console.log('🧪 Skipping database operations for test order');
    }

    // Terbitkan event setelah transaksi database selesai
    await messagePublisher.publishOrderStatusUpdate(order.id, orderStatus);

    // Kirim notifikasi WhatsApp terpadu untuk pembayaran berhasil dan status pesanan
    try {
        await messagePublisher.publishWhatsAppPaymentAndOrderUpdate(order.id, orderStatus);
        console.log(`� Published consolidated WhatsApp notification for order ${order.id} with status ${orderStatus}`);
    } catch (whatsappError) {
        console.error('❌ Error publishing WhatsApp notification:', whatsappError);
        // Don't fail the payment process if WhatsApp notification fails
    }
}


export async function handlePaymentFailure(orderId: string) {
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            items: { include: { product: true } },
            bookingSlot: true,
            outlet: true,
            guestCustomer: true,
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

    await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' },
    });

    if (order.bookingSlot) {
        await db.bookingSlot.update({
            where: { id: order.bookingSlot.id },
            data: { status: 'AVAILABLE' },
        });
    }

    // Emit notification to business outlet
    try {
        socketUtils.emitToBusinessOutlet(order.outletId, {
            type: 'payment_failed',
            orderId: order.id,
            amount: order.totalAmount,
            orderStatus: 'CANCELLED',
            customerName: order.guestCustomer?.name || 'Customer',
            timestamp: new Date()
        });
        console.log(`📡 Emitted payment_failed event for outlet ${order.outletId}`);
    } catch (socketError) {
        console.error('❌ Error emitting payment_failed event:', socketError);
    }

    // Tidak perlu kembalikan quantity karena belum dikurangi saat checkout
}
