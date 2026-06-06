import logger from "../utils/logger";
import { apiClient } from "../lib/api-client";

// Tipe data ini perlu disesuaikan atau diimpor agar sesuai dengan data dari API
interface OrderWithDetails {
    id: string;
    outlet: { name: string; businessId?: string };
    items: { product: { name: string }; quantity: number }[];
    totalAmount: number;
    guestCustomer: { name: string; phone: string | null };
}

interface Transaction {
    paymentUrl?: string | null;
}

export class NotificationService {
    private static async sendWhatsAppMessage(phone: string, message: string, businessId?: string) {
        if (!businessId) {
            logger.warn(`Skipping WhatsApp notification: No businessId provided (integration connection required)`, {
                component: 'NotificationService',
                phone
            });
            return;
        }

        const formattedPhone = phone.startsWith("+")
            ? phone
            : `+62${phone.substring(1)}`;

        try {
            logger.info(`Sending WhatsApp message via Baileys integration for business: ${businessId}`, {
                component: 'NotificationService',
                phone: formattedPhone
            });
            const response = await apiClient.post('/internal/whatsapp/send', {
                businessId,
                phoneNumber: formattedPhone,
                message
            });
            if (response.status === 200) {
                logger.info(`WhatsApp message successfully sent via Baileys integration for business: ${businessId}`, {
                    component: 'NotificationService'
                });
                return;
            }
        } catch (error: any) {
            logger.error(`Failed to send WhatsApp message via Baileys integration: ${error.message}`, {
                component: 'NotificationService',
                error: error.response?.data || error.message
            });
            throw error;
        }
    }

    private static formatOrderDetails(order: OrderWithDetails): string {
        const items = order.items
            .map((item) => `• ${item.product.name} (x${item.quantity})`)
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

    public static async sendQueueNotification(phone: string, queuePosition: number, businessId?: string) {
        const message = `📢 *Panggilan Antrian!*
Nomor antrian Anda sekarang adalah *${queuePosition}*.
Mohon segera menuju ke area layanan kami.

Terima kasih!`;
        await this.sendWhatsAppMessage(phone, message, businessId);
    }

    public static async sendOrderStatusUpdate(phone: string, order: OrderWithDetails, status: string, businessId?: string) {
        let message = `🔔 *Update Status Pesanan*

Status pesanan Anda \`#${order.id}\` telah diperbarui menjadi: *${status}*.`;

        message += `\n\n${this.formatOrderDetails(order)}`;
        await this.sendWhatsAppMessage(phone, message, businessId);
    }

    public static async sendPaymentReminder(order: OrderWithDetails, transaction: Transaction, businessId?: string) {
        if (!order.guestCustomer.phone) {
            logger.warn(`No phone number for order ${order.id}, reminder not sent.`, { component: 'NotificationService' });
            return;
        }

        const details = this.formatOrderDetails(order);
        let message = `⏳ *Pengingat Pembayaran*

Hai *${order.guestCustomer.name.trim()}*, pesanan Anda masih menunggu penyelesaian pembayaran.

${details}`;

        if (transaction.paymentUrl) {
            message += `\n\n🔗 *Silakan selesaikan pembayaran Anda melalui link berikut:*\n${transaction.paymentUrl}`;
        } else {
            message += `\n\nSilakan selesaikan pembayaran Anda melalui aplikasi.`;
        }

        await this.sendWhatsAppMessage(order.guestCustomer.phone, message, businessId);
    }

    public static async sendCustomWhatsAppMessage(phone: string, message: string, businessId?: string) {
        await this.sendWhatsAppMessage(phone, message, businessId);
    }
}
