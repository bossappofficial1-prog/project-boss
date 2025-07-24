import { connectRabbitMQ, getRabbitMQChannel } from './config/rabbitmq';
import { NotificationService } from './service/notification.service';
import { getOrderByIdService } from './service/order.service';

async function processNotification(msg: any) {
    const channel = getRabbitMQChannel();
    if (msg) {
        const { orderId, status } = JSON.parse(msg.content.toString());
        console.log(`[WORKER] Menerima notifikasi untuk Order ID ${orderId} dengan status ${status}`);

        try {
            const order = await getOrderByIdService(orderId);
            if (order) {
                // Customize message based on status
                let message = `Status pesanan Anda #${order.id} telah diperbarui menjadi ${status}.`;
                if (status === 'COMPLETED') {
                    message = `Pesanan Anda #${order.id} telah selesai. Terima kasih!`;
                }
                await NotificationService.sendOrderStatusUpdate(order.guestCustomer.phone, orderId, order.orderStatus);
            }
            channel.ack(msg);
        } catch (error) {
            console.error(`[WORKER] Gagal mengirim notifikasi untuk pesanan ${orderId}:`, error);
            channel.nack(msg, false, true);
        }
    }
}

async function startWorker() {
    await connectRabbitMQ();
    const channel = getRabbitMQChannel();
    const queue = 'notification_queue';

    await channel.assertQueue(queue, { durable: true });
    console.log(`[WORKER] Menunggu notifikasi di queue: ${queue}`);

    channel.consume(queue, processNotification, { noAck: false });
}

startWorker();