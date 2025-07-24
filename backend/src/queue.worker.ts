import { connectRabbitMQ, getRabbitMQChannel } from './config/rabbitmq';
import { NotificationService } from './service/notification.service';
import { OrderRepository } from './repositories/order.repository';
import { OrderStatus } from '@prisma/client';
import { db } from './config/prisma';

const QUEUE_NAME = 'service_order_queue';

async function processServiceOrderQueue() {
    await connectRabbitMQ();
    const channel = getRabbitMQChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(`[WORKER] Menunggu pesanan di queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, async (msg) => {
        if (msg) {
            try {
                const { orderId } = JSON.parse(msg.content.toString());
                console.log(`[WORKER] Memproses pesanan dari queue untuk Order ID: ${orderId}`);

                // Dapatkan detail pesanan untuk mengetahui outletId
                const currentOrder = await OrderRepository.findById(orderId);
                if (!currentOrder) {
                    console.error(`[WORKER] Pesanan dengan ID ${orderId} tidak ditemukan.`);
                    channel.ack(msg); // Anggap selesai jika pesanan tidak ada
                    return;
                }

                // Ambil semua pesanan yang sedang diproses di outlet yang sama
                const queueForOutlet = await db.order.findMany({
                    where: {
                        outletId: currentOrder.outletId,
                        orderStatus: OrderStatus.PROCESSING,
                        items: { some: { product: { type: 'SERVICE' } } }
                    },
                    orderBy: { createdAt: 'asc' },
                    include: { guestCustomer: true }
                });

                // Cek posisi pesanan saat ini dalam antrian outlet
                const orderIndex = queueForOutlet.findIndex(o => o.id === orderId);

                // Kirim notifikasi jika masuk 3 besar
                if (orderIndex !== -1 && orderIndex < 3) {
                    const order = queueForOutlet[orderIndex];
                    if (order.guestCustomer?.phone) {
                        await NotificationService.sendQueueNotification(order.guestCustomer.phone, orderIndex + 1);
                    }
                }

                channel.ack(msg);
            } catch (error) {
                console.error('[WORKER] Gagal memproses pesan dari queue:', error);
                // Jangan kembalikan pesan ke antrian untuk menghindari infinite loop
                channel.nack(msg, false, false);
            }
        }
    }, { noAck: false });
}

processServiceOrderQueue();
