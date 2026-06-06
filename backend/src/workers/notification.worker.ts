import amqplib from 'amqplib';
import { config } from '../config/index.js';
import logger from '../utils/pino.logger.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { IntegrationService } from '../service/integration.service.js';
import { generateTicketsPDF } from '../service/pdf.service.js';
import { TicketService } from '../service/ticket.service.js';

const QUEUE_NAME = 'notification_queue';
const EXCHANGE_NAME = 'notification_exchange';
const DLQ_NAME = 'notification_queue_dlq';
const RETRY_QUEUE_NAME = 'notification_queue_retry';
const DLX_NAME = 'notification_dlx';
const RETRY_EXCHANGE_NAME = 'notification_retry_exchange';
const RETRY_DELAY_MS = 30 * 1000; // 30 detik

interface BaseNotificationEvent {
    type: string;
    payload: any;
}

interface OrderNotificationEvent extends BaseNotificationEvent {
    type: 'ORDER_STATUS_UPDATE';
    payload: {
        orderId: string;
        status: string;
    };
}

interface QueuePositionEvent extends BaseNotificationEvent {
    type: 'queue_position';
    data: {
        phone: string;
        position: number;
        businessId?: string;
    };
}

interface WhatsAppNotificationEvent extends BaseNotificationEvent {
    type: 'WHATSAPP_PAYMENT_SUCCESS' | 'WHATSAPP_ORDER_CONFIRMATION' | 'WHATSAPP_PICKUP_REMINDER' | 'WHATSAPP_PAYMENT_AND_ORDER_UPDATE';
    payload: {
        orderId: string;
        orderStatus?: string;
    };
}

type NotificationEvent = OrderNotificationEvent | QueuePositionEvent | WhatsAppNotificationEvent;

async function getOrderData(orderId: string): Promise<any> {
    if (orderId === 'TEST123') {
        logger.info({ component: 'NotificationWorker' }, '🧪 Using mock order data for WhatsApp test');
        return {
            id: 'TEST123',
            totalAmount: 50000,
            paymentMethod: 'QRIS',
            updatedAt: new Date().toISOString(),
            guestCustomer: {
                name: 'Test Customer',
                phone: '+6283180541892'
            },
            outlet: {
                name: 'Test Outlet',
                address: 'Jl. Test No. 123',
                phone: '+6281234567890',
                whatsapp: '+6281234567890',
                businessId: 'TEST_BUSINESS_ID'
            },
            items: [
                {
                    quantity: 2,
                    product: {
                        name: 'Konser Musik Jazz',
                        type: 'TICKET'
                    },
                    ticketCodes: [
                        { code: 'TKT-JAZZ-8827', status: 'VALID' },
                        { code: 'TKT-JAZZ-8828', status: 'VALID' }
                    ]
                }
            ]
        };
    }

    const order = await OrderRepository.findById(orderId);
    if (!order) {
        throw new Error(`Order not found: ${orderId}`);
    }

    const mappedOrder: any = {
        ...order,
        guestCustomer: order.guestCustomer ? {
            name: order.guestCustomer.name,
            phone: order.guestCustomer.phone
        } : { name: 'Customer', phone: '' },
        outlet: order.outlet ? {
            name: order.outlet.name,
            address: order.outlet.address || '',
            phone: order.outlet.phone || '',
            whatsapp: order.outlet.phone || '',
            businessId: order.outlet.businessId
        } : { name: 'Outlet', address: '', phone: '', businessId: '' },
        items: (order.items || []).map((item: any) => ({
            quantity: item.quantity,
            product: {
                name: item.product?.name || 'Product',
                type: item.product?.type || 'GOODS'
            },
            ticketCodes: (item.ticketCodes || []).map((tc: any) => ({
                code: tc.code,
                status: tc.status
            }))
        }))
    };

    const bookingSlotItem = order.items?.find((item: any) => item.bookingSlot);
    if (bookingSlotItem && bookingSlotItem.bookingSlot) {
        mappedOrder.bookingSlot = {
            dateTime: bookingSlotItem.bookingSlot.startTime || bookingSlotItem.bookingSlot.date
        };
    }

    return mappedOrder;
}

function formatOrderDetails(order: any): string {
    const items = (order.items || [])
        .map((item: any) => `• ${item.product.name} (x${item.quantity})`)
        .join("\n");

    return `
🧾 *Detail Pesanan*
*No. Order:* \`#${order.id}\`
*Outlet:* ${order.outlet.name}

🛍️ *Produk:*
${items}

💰 *Total:* *Rp${order.totalAmount.toLocaleString("id-ID")}*
    `.trim();
}

async function generatePaymentSuccessMessage(orderId: string): Promise<string> {
    const order = await getOrderData(orderId);
    return `Halo *${order.guestCustomer.name}*, Terima kasih! ❤️

Pembayaran Anda sebesar *Rp ${order.totalAmount.toLocaleString('id-ID')}* telah kami terima dengan baik.

*Nomor Transaksi:* #${order.id}

⏳ *Sedang Dikonfirmasi*
Pesanan Anda saat ini sedang dikonfirmasi oleh tim *${order.outlet.name}*. Kami akan segera mengabari Anda jika pesanan Anda sudah siap.

Terima kasih telah mempercayai kami! 😊`.trim();
}

function generateTicketMessage(order: any): string {
    const ticketDetails = order.items
        .filter((item: any) => item.product.type === 'TICKET')
        .map((item: any) => {
            const codes = (item.ticketCodes || [])
                .map((tc: any) => `🎫 *${tc.code}* (${tc.status === 'VALID' ? 'Aktif' : 'Terpakai'})`)
                .join('\n');
            return `🎟️ *Nama Tiket:* ${item.product.name}\n*Jumlah:* ${item.quantity} Tiket\n*Kode Penukaran:*\n${codes || '_Sedang diproses_'}`;
        })
        .join('\n\n');

    return `🎉 *E-TIKET ANDA SUDAH SIAP!*

Halo *${order.guestCustomer.name}*, berikut adalah tiket digital Anda untuk digunakan saat masuk/penukaran:

${ticketDetails}

📋 *Detail Transaksi:*
• Nomor Transaksi: #${order.id}
• Tempat: ${order.outlet.name}

📍 *Alamat:*
${order.outlet.address}

📞 *Butuh bantuan? Hubungi kami:*
WhatsApp: ${order.outlet.whatsapp || order.outlet.phone}

*Catatan:* Silakan tunjukkan kode tiket (emoji 🎫) di atas kepada petugas di lokasi saat kedatangan. Sampai jumpa! 👋`.trim();
}

async function generateOrderConfirmedMessage(orderId: string): Promise<string> {
    const order = await getOrderData(orderId);
    const isTicket = order.items.some((item: any) => item.product.type === 'TICKET');
    const isService = order.items.some((item: any) => item.product.type === 'SERVICE');

    if (isTicket) {
        return generateTicketMessage(order);
    } else if (isService && order.bookingSlot) {
        const serviceItem = order.items.find((item: any) => item.product.type === 'SERVICE');
        return `💼 *JADWAL LAYANAN DIKONFIRMASI*

Halo *${order.guestCustomer.name}*!

Jadwal layanan Anda telah dikonfirmasi oleh tim kami:
📅 *Tanggal:* ${new Date(order.bookingSlot.dateTime).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ *Waktu:* ${new Date(order.bookingSlot.dateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
📍 *Lokasi:* ${order.outlet.name}

📋 *Detail Layanan:*
• ${serviceItem?.product.name} (${serviceItem?.quantity} sesi)

📞 *Butuh bantuan / Reschedule:*
WhatsApp: ${order.outlet.whatsapp || order.outlet.phone}

Mohon hadir 15 menit sebelum waktu pemesanan Anda. Terima kasih! 😊`.trim();
    } else {
        const items = order.items.map((item: any) =>
            `📦 *${item.product.name}* (${item.quantity} pcs)`
        ).join('\n');

        return `🎉 *PESANAN ANDA SIAP DIAMBIL!*

Halo *${order.guestCustomer.name}*!

Kabar baik, pesanan Anda sudah siap dan dapat diambil di *${order.outlet.name}*.

📋 *Detail Pesanan:*
${items}
• Nomor Transaksi: #${order.id}

📍 *Lokasi Pengambilan:*
${order.outlet.name} (${order.outlet.address})

📞 *Hubungi kami jika ada pertanyaan:*
WhatsApp: ${order.outlet.whatsapp || order.outlet.phone}

Ditunggu kedatangannya ya! Terima kasih banyak. 🙏`.trim();
    }
}

async function generateReminderMessage(orderId: string, type: 'payment' | 'pickup'): Promise<string> {
    const order = await getOrderData(orderId);
    if (type === 'payment') {
        return `⏰ *PENGINGAT PEMBAYARAN*

Halo *${order.guestCustomer.name}*!

Kami ingin mengabari bahwa pembayaran Anda untuk pesanan *#${order.id}* sebesar *Rp ${order.totalAmount.toLocaleString('id-ID')}* masih menunggu penyelesaian.

Silakan selesaikan pembayaran agar pesanan Anda dapat segera kami proses.

Jika ada kendala, silakan hubungi kami via WhatsApp: ${order.outlet.whatsapp || order.outlet.phone}

Terima kasih banyak! 🙏`.trim();
    } else {
        return `⏰ *PENGINGAT PENJEMPUTAN*

Halo *${order.guestCustomer.name}*!

Pesanan Anda dengan nomor transaksi *#${order.id}* sudah siap di *${order.outlet.name}* sejak beberapa waktu lalu.

📍 *Lokasi Pengambilan:*
${order.outlet.name} (${order.outlet.address})

Mohon segera diambil ya agar pesanan Anda tetap segar/terjaga kualitasnya. Terima kasih! 😊`.trim();
    }
}

async function generateConsolidatedPaymentMessage(orderId: string, orderStatus: string): Promise<string> {
    const order = await getOrderData(orderId);
    const isTicket = order.items.some((item: any) => item.product.type === 'TICKET');
    const isService = order.items.some((item: any) => item.product.type === 'SERVICE');
    const isReady = orderStatus === 'READY' || orderStatus === 'CONFIRMED' || orderStatus === 'COMPLETED';

    let statusMessage = '';
    if (isTicket) {
        const ticketDetails = order.items
            .filter((item: any) => item.product.type === 'TICKET')
            .map((item: any) => {
                const codes = (item.ticketCodes || [])
                    .map((tc: any) => `🎫 *${tc.code}*`)
                    .join('\n');
                return `🎟️ *Nama Tiket:* ${item.product.name}\n*Kode Tiket:*\n${codes || '_Sedang diproses_'}`;
            })
            .join('\n\n');
        
        statusMessage = `🎉 *E-TIKET ANDA SUDAH SIAP!*

Berikut adalah tiket digital Anda:

${ticketDetails}

📍 *Lokasi:*
${order.outlet.name} (${order.outlet.address})`;
    } else if (isService && order.bookingSlot) {
        statusMessage = `💼 *JADWAL LAYANAN DIKONFIRMASI*

Layanan ${order.items.find((item: any) => item.product.type === 'SERVICE')?.product.name} sudah dijadwalkan:
📅 *Tanggal:* ${new Date(order.bookingSlot.dateTime).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ *Waktu:* ${new Date(order.bookingSlot.dateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB

Mohon hadir 15 menit sebelum waktu pemesanan.`;
    } else if (isReady) {
        const items = order.items.map((item: any) =>
            `📦 *${item.product.name}* (${item.quantity} pcs)`
        ).join('\n');

        statusMessage = `🎉 *PESANAN ANDA SIAP DIAMBIL!*

Pesanan Anda sudah siap dan dapat diambil di *${order.outlet.name}*.

📋 *Detail Pesanan:*
${items}

📍 *Lokasi Pengambilan:*
${order.outlet.name} (${order.outlet.address})`;
    } else {
        statusMessage = `⏳ *PESANAN SEDANG DISIAPKAN*

Tim kami di *${order.outlet.name}* sedang menyiapkan pesanan Anda dengan penuh kasih sayang. Kami akan segera memberi tahu Anda jika sudah siap.`;
    }

    return `✅ *PEMBAYARAN BERHASIL*

Halo *${order.guestCustomer.name}*!

Pembayaran sebesar *Rp ${order.totalAmount.toLocaleString('id-ID')}* telah kami terima untuk transaksi *#${order.id}*.

${statusMessage}

📞 *Butuh bantuan? Hubungi kami:*
WhatsApp: ${order.outlet.whatsapp || order.outlet.phone}

Terima kasih atas kepercayaannya! ❤️`.trim();
}

async function sendWhatsAppMessage(phone: string, message: string, businessId?: string) {
    if (!businessId) {
        logger.warn({ component: 'NotificationWorker' }, `Skipping WhatsApp notification: No businessId provided (integration connection required)`);
        return;
    }

    const formattedPhone = phone.startsWith("+")
        ? phone
        : `+62${phone.substring(1)}`;

    try {
        logger.info({ component: 'NotificationWorker', phone: formattedPhone }, `Sending WhatsApp message via Baileys integration for business: ${businessId}`);
        const success = await IntegrationService.sendWhatsAppMessage(businessId, formattedPhone, message);
        if (success) {
            logger.info({ component: 'NotificationWorker' }, `WhatsApp message successfully sent via Baileys integration for business: ${businessId}`);
            return;
        } else {
            throw new Error(`Failed to send message via Baileys socket for business ${businessId}`);
        }
    } catch (error: any) {
        logger.error({ component: 'NotificationWorker', error: error.message }, `Failed to send WhatsApp message via Baileys integration`);
        throw error;
    }
}

async function sendWhatsAppTicketPdf(order: any, phone: string, businessId?: string) {
    if (!businessId) return;

    try {
        logger.info({ component: 'NotificationWorker', orderId: order.id }, `Fetching ticket print data for WhatsApp PDF`);
        const ticketsData = await TicketService.getOrderTicketsPrintData(order.id);

        if (!ticketsData || ticketsData.length === 0) {
            logger.info({ component: 'NotificationWorker', orderId: order.id }, `No tickets found for this order, skipping PDF`);
            return;
        }

        logger.info({ component: 'NotificationWorker', orderId: order.id }, `Generating PDF ticket for order`);
        const pdfBuffer = await generateTicketsPDF(ticketsData);
        
        const formattedPhone = phone.startsWith("+") ? phone : `+62${phone.substring(1)}`;
        const fileName = `tiket-${order.id}.pdf`;
        
        logger.info({ component: 'NotificationWorker', phone: formattedPhone }, `Sending WhatsApp ticket PDF file to customer`);
        await IntegrationService.sendWhatsAppDocument(
            businessId,
            formattedPhone,
            pdfBuffer,
            fileName,
            'application/pdf',
            `Halo *${order.guestCustomer.name}*, berikut kami lampirkan file PDF E-Tiket Anda. Silakan diunduh.`
        );
    } catch (error: any) {
        logger.error({ component: 'NotificationWorker', error: error.message }, `Failed to generate/send WhatsApp ticket PDF file`);
    }
}

class NotificationWorker {
    private channel: amqplib.Channel | null = null;
    private isRunning = false;

    async start(sharedChannel?: amqplib.Channel) {
        if (this.isRunning) {
            logger.warn({ component: 'NotificationWorker' }, 'Notification worker already running');
            return;
        }
        this.isRunning = true;

        try {
            if (sharedChannel) {
                this.channel = sharedChannel;
            } else {
                const connection = await amqplib.connect(config.rabbitmq.url);
                this.channel = await connection.createChannel();
            }
            const ch = this.channel;

            // Setup Exchanges
            await ch.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
            await ch.assertExchange(DLX_NAME, 'direct', { durable: true });
            await ch.assertExchange(RETRY_EXCHANGE_NAME, 'direct', { durable: true });

            // Setup DLQ
            await ch.assertQueue(DLQ_NAME, { durable: true });
            await ch.bindQueue(DLQ_NAME, DLX_NAME, '');

            // Setup Retry Queue
            await ch.assertQueue(RETRY_QUEUE_NAME, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': EXCHANGE_NAME,
                    'x-message-ttl': RETRY_DELAY_MS,
                }
            });
            await ch.bindQueue(RETRY_QUEUE_NAME, RETRY_EXCHANGE_NAME, '');

            // Setup Main Queue
            await ch.assertQueue(QUEUE_NAME, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': DLX_NAME,
                }
            });
            await ch.bindQueue(QUEUE_NAME, EXCHANGE_NAME, '');

            logger.info({ component: 'NotificationWorker' }, 'Notification worker started');
            ch.consume(QUEUE_NAME, (msg) => this.processMessage(msg), { noAck: false });

        } catch (error: any) {
            this.isRunning = false;
            logger.error({ component: 'NotificationWorker', error: error.message }, 'Failed to start notification worker');
            throw error;
        }
    }

    private async processMessage(msg: amqplib.ConsumeMessage | null) {
        if (!msg) return;

        const content = msg.content.toString();
        let messageData: NotificationEvent | any;

        try {
            messageData = JSON.parse(content);

            logger.info({
                component: 'NotificationWorker',
                messageType: messageData.type,
            }, 'Processing notification message');

            switch (messageData.type) {
                case 'ORDER_STATUS_UPDATE':
                    await this.handleOrderStatusUpdate(messageData as OrderNotificationEvent);
                    break;
                case 'queue_position':
                    await this.handleQueuePosition(messageData as QueuePositionEvent);
                    break;
                case 'WHATSAPP_PAYMENT_SUCCESS':
                case 'WHATSAPP_ORDER_CONFIRMATION':
                case 'WHATSAPP_PICKUP_REMINDER':
                case 'WHATSAPP_PAYMENT_AND_ORDER_UPDATE':
                    await this.handleWhatsAppNotification(messageData as WhatsAppNotificationEvent);
                    break;
                default:
                    logger.warn({
                        component: 'NotificationWorker',
                        messageType: messageData.type,
                    }, 'Unknown message type');
            }

            this.channel?.ack(msg);
        } catch (error: any) {
            logger.error({
                component: 'NotificationWorker',
                error: error.message,
                content: content,
            }, 'Error processing message');

            const headers = msg.properties.headers || {};
            const retryCount = (headers['x-retry-count'] || 0) + 1;
            const MAX_RETRIES = 5;

            if (retryCount > MAX_RETRIES) {
                logger.error({
                    component: 'NotificationWorker',
                }, `Max retries (${MAX_RETRIES}) exceeded for message. Sending to DLQ.`);
                this.channel?.nack(msg, false, false);
            } else {
                logger.warn({
                    component: 'NotificationWorker',
                }, `Retrying message. Attempt: ${retryCount}/${MAX_RETRIES}`);
                headers['x-retry-count'] = retryCount;
                this.channel?.publish(RETRY_EXCHANGE_NAME, '', msg.content, { headers });
                this.channel?.ack(msg);
            }
        }
    }

    private async handleOrderStatusUpdate(event: OrderNotificationEvent) {
        const { orderId, status } = event.payload;

        const order = await getOrderData(orderId);
        if (!order.guestCustomer.phone) {
            logger.warn({ component: 'NotificationWorker', orderId }, 'Order does not have a phone number, skipping notification');
            return;
        }

        const isTicket = order.items.some((item: any) => item.product.type === 'TICKET');
        const isReadyOrCompleted = status === 'READY' || status === 'CONFIRMED' || status === 'COMPLETED';

        let message = '';
        if (isTicket && isReadyOrCompleted) {
            message = generateTicketMessage(order);
        } else {
            const details = formatOrderDetails(order);
            message = `🔔 *Update Status Pesanan*\n\nStatus pesanan Anda \`#${order.id}\` telah diperbarui menjadi: *${status}*.\n\n${details}`;
        }

        await sendWhatsAppMessage(order.guestCustomer.phone, message, order.outlet?.businessId);
        logger.info({ component: 'NotificationWorker', orderId }, `Successfully processed status update notification to status ${status}`);

        // Kirim E-Tiket PDF sebagai file jika tipe pesanan TICKET dan sukses
        if (isTicket && isReadyOrCompleted) {
            await sendWhatsAppTicketPdf(order, order.guestCustomer.phone, order.outlet?.businessId);
        }
    }

    private async handleQueuePosition(event: QueuePositionEvent) {
        const { phone, position, businessId } = event.data;

        const message = `📢 *Panggilan Antrian!*\nNomor antrian Anda sekarang adalah *${position}*.\nMohon segera menuju ke area layanan kami.\n\nTerima kasih!`;
        await sendWhatsAppMessage(phone, message, businessId);
        logger.info({ component: 'NotificationWorker', phone }, 'Successfully processed queue position notification');
    }

    private async handleWhatsAppNotification(event: WhatsAppNotificationEvent) {
        const { orderId, orderStatus } = event.payload;
        const { type } = event;

        let message: string;
        switch (type) {
            case 'WHATSAPP_PAYMENT_SUCCESS':
                message = await generatePaymentSuccessMessage(orderId);
                break;
            case 'WHATSAPP_ORDER_CONFIRMATION':
                message = await generateOrderConfirmedMessage(orderId);
                break;
            case 'WHATSAPP_PICKUP_REMINDER':
                message = await generateReminderMessage(orderId, 'pickup');
                break;
            case 'WHATSAPP_PAYMENT_AND_ORDER_UPDATE':
                message = await generateConsolidatedPaymentMessage(orderId, orderStatus || 'PENDING');
                break;
            default:
                logger.warn({ component: 'NotificationWorker', type, orderId }, 'Unknown WhatsApp notification type');
                return;
        }

        const orderData = await getOrderData(orderId);
        if (!orderData.guestCustomer.phone) {
            logger.warn({ component: 'NotificationWorker', orderId, type }, 'Order does not have a phone number, skipping WhatsApp notification');
            return;
        }

        await sendWhatsAppMessage(orderData.guestCustomer.phone, message, orderData.outlet?.businessId);
        logger.info({ component: 'NotificationWorker', orderId, type }, `Successfully processed WhatsApp ${type} notification`);

        // Kirim E-Tiket PDF sebagai file jika tipe pesanan TICKET dan pembayaran sukses
        const isTicket = orderData.items.some((item: any) => item.product.type === 'TICKET');
        if (isTicket && (type === 'WHATSAPP_PAYMENT_SUCCESS' || type === 'WHATSAPP_PAYMENT_AND_ORDER_UPDATE')) {
            await sendWhatsAppTicketPdf(orderData, orderData.guestCustomer.phone, orderData.outlet?.businessId);
        }
    }

    stop() {
        this.isRunning = false;
        logger.info({ component: 'NotificationWorker' }, 'Notification worker stopped');
    }
}

export const notificationWorker = new NotificationWorker();
