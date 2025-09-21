import { TwilioService } from "./twilio.service";
import logger from "../utils/logger";

// Tipe data ini perlu disesuaikan atau diimpor agar sesuai dengan data dari API
interface OrderWithDetails {
    id: string;
    outlet: { name: string };
    items: { product: { name: string }; quantity: number }[];
    totalAmount: number;
    guestCustomer: { name: string; phone: string | null };
}

interface Transaction {
    paymentUrl?: string | null;
}

export class NotificationService {
    private static twilioService = new TwilioService();

    private static async sendWhatsAppMessage(phone: string, message: string) {
        const formattedPhone = phone.startsWith("+")
            ? phone
            : `+62${phone.substring(1)}`;
        await this.twilioService.sendWhatsAppMessage(formattedPhone, message);
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

    public static async sendQueueNotification(phone: string, queuePosition: number) {
        const message = `📢 *Panggilan Antrian!*
Nomor antrian Anda sekarang adalah *${queuePosition}*.
Mohon segera menuju ke area layanan kami.

Terima kasih!`;
        await this.sendWhatsAppMessage(phone, message);
    }

    public static async sendOrderStatusUpdate(phone: string, order: OrderWithDetails, status: string) {
        let message = `🔔 *Update Status Pesanan*

Status pesanan Anda \`#${order.id}\` telah diperbarui menjadi: *${status}*.`;

        message += `\n\n${this.formatOrderDetails(order)}`;
        await this.sendWhatsAppMessage(phone, message);
    }

    public static async sendPaymentReminder(order: OrderWithDetails, transaction: Transaction) {
        if (!order.guestCustomer.phone) {
            logger.warn(`No phone number for order ${order.id}, reminder not sent.`, { component: 'NotificationService' });
            return;
        };

        const details = this.formatOrderDetails(order);
        let message = `⏳ *Pengingat Pembayaran*

Hai *${order.guestCustomer.name.trim()}*, pesanan Anda masih menunggu penyelesaian pembayaran.

${details}`;

        if (transaction.paymentUrl) {
            message += `\n\n🔗 *Silakan selesaikan pembayaran Anda melalui link berikut:*\n${transaction.paymentUrl}`;
        } else {
            message += `\n\nSilakan selesaikan pembayaran Anda melalui aplikasi.`;
        }

        await this.sendWhatsAppMessage(order.guestCustomer.phone, message);
    }

    public static async sendCustomWhatsAppMessage(phone: string, message: string) {
        await this.sendWhatsAppMessage(phone, message);
    }
}
