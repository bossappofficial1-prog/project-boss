import { apiClient } from '../lib/api-client';
import logger from '../utils/logger';

interface OrderData {
    id: string;
    totalAmount: number;
    paymentMethod?: string;
    updatedAt: string;
    guestCustomer: {
        name: string;
        phone: string;
    };
    outlet: {
        name: string;
        address: string;
        phone: string;
        whatsapp?: string;
    };
    items: Array<{
        quantity: number;
        product: {
            name: string;
            type: 'GOODS' | 'SERVICE';
        };
    }>;
    bookingSlot?: {
        dateTime: string;
    };
}

export class NotificationMessageService {
    static async getOrderData(orderId: string): Promise<OrderData> {
        try {
            const response = await apiClient.get(`/orders/${orderId}/notification-data`);
            return response.data.data;
        } catch (error: any) {
            logger.error('Failed to get order data for notification', {
                component: 'NotificationMessageService',
                orderId,
                error: error.message
            });
            throw new Error(`Failed to get order data: ${error.message}`);
        }
    }

    static async generatePaymentSuccessMessage(orderId: string): Promise<string> {
        const order = await this.getOrderData(orderId);

        return `✅ *PEMBAYARAN BERHASIL*

Halo ${order.guestCustomer.name}!

Pembayaran Anda sebesar Rp ${order.totalAmount.toLocaleString('id-ID')} telah berhasil diproses.
Order ID: ${order.id}

⏳ *Menunggu konfirmasi dari ${order.outlet.name}*
Kami akan segera mengonfirmasi pesanan Anda dalam 1-2 jam.

Terima kasih telah berbelanja di ${order.outlet.name}! 🛒`;
    }

    static async generateOrderConfirmedMessage(orderId: string): Promise<string> {
        const order = await this.getOrderData(orderId);

        const isService = order.items.some(item => item.product.type === 'SERVICE');

        if (isService && order.bookingSlot) {
            return this.generateServiceConfirmationMessage(order);
        } else {
            return this.generateProductPickupMessage(order);
        }
    }

    private static generateProductPickupMessage(order: OrderData): string {
        const items = order.items.map(item =>
            `📦 ${item.product.name} - ${item.quantity} pcs`
        ).join('\n');

        return `🎉 *PESANAN ANDA SUDAH SIAP DIAMBIL!*

Halo ${order.guestCustomer.name}!

Pesanan Anda sudah dikonfirmasi dan siap diambil di ${order.outlet.name}.
Status: ✅ *READY FOR PICKUP*

📋 *Detail Pesanan:*
• Order ID: ${order.id}
• Total: Rp ${order.totalAmount.toLocaleString('id-ID')}
• Metode Pembayaran: ${order.paymentMethod || 'Online'}

📍 *Lokasi Pengambilan:*
${order.outlet.name}
${order.outlet.address}
Jam: 08:00 - 17:00

📞 *Hubungi kami untuk konfirmasi pengambilan:*
• WhatsApp: ${order.outlet.whatsapp || order.outlet.phone}
• Telepon: ${order.outlet.phone}

⏰ *Mohon ambil dalam 3 hari kerja*
Jika tidak diambil, pesanan akan dibatalkan otomatis.

Terima kasih atas kepercayaan Anda! 🙏`;
    }

    private static generateServiceConfirmationMessage(order: OrderData): string {
        const serviceItem = order.items.find(item => item.product.type === 'SERVICE');

        return `💼 *JADWAL LAYANAN ANDA SUDAH DIKONFIRMASI*

Halo ${order.guestCustomer.name}!

Layanan ${serviceItem?.product.name} sudah dikonfirmasi:
📅 Tanggal: ${new Date(order.bookingSlot!.dateTime).toLocaleDateString('id-ID')}
⏰ Waktu: ${new Date(order.bookingSlot!.dateTime).toLocaleTimeString('id-ID')}
📍 Lokasi: ${order.outlet.name} - ${order.outlet.address}

📋 *Detail Layanan:*
• ${serviceItem?.product.name} - ${serviceItem?.quantity} sesi

📞 *Konfirmasi kehadiran:*
WhatsApp: ${order.outlet.whatsapp || order.outlet.phone}
Telepon: ${order.outlet.phone}

Mohon datang 15 menit sebelum waktu booking.

Terima kasih! 💼`;
    }

    static async generateReminderMessage(orderId: string, type: 'payment' | 'pickup'): Promise<string> {
        const order = await this.getOrderData(orderId);

        if (type === 'payment') {
            return `⏰ *UPDATE PESANAN ANDA*

Halo ${order.guestCustomer.name}!

Pembayaran Anda sudah berhasil, namun kami masih menunggu konfirmasi dari ${order.outlet.name}.

Mohon bersabar, biasanya konfirmasi memakan waktu 1-2 jam.
Jika ada pertanyaan, silakan hubungi kami di WhatsApp: ${order.outlet.whatsapp || order.outlet.phone}

Terima kasih atas pengertiannya! 🙏`;
        } else {
            return `⏰ *REMINDER: PESANAN ANDA SUDAH SIAP DIAMBIL*

Halo ${order.guestCustomer.name}!

Pesanan Anda sudah siap diambil sejak ${new Date(order.updatedAt).toLocaleDateString('id-ID')}.
Order ID: ${order.id}

📍 Lokasi: ${order.outlet.name} - ${order.outlet.address}
⏰ Batas pengambilan: ${new Date(new Date(order.updatedAt).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')}

Mohon segera ambil pesanan Anda agar tidak expired.

Terima kasih! 🙏`;
        }
    }
}