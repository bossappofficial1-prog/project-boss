import { Order } from "@prisma/client";
import { OrderWithDetails } from "../types/response";
import { TwilioService } from "./twilio.service";

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

    public static async sendQueueNotification(
        phone: string,
        queuePosition: number
    ) {
        const message = `📢 *Panggilan Antrian!*
Nomor antrian Anda sekarang adalah *${queuePosition}*.
Mohon segera menuju ke area layanan kami.

Terima kasih!`;

        await this.sendWhatsAppMessage(phone, message);
    }

    public static async sendOrderConfirmation(order: OrderWithDetails) {
        if (!order.guestCustomer.phone) {
            console.log(
                `Tidak ada nomor telepon untuk pesanan ${order.id}, notifikasi tidak dikirim.`
            );
            return;
        }

        const details = this.formatOrderDetails(order);
        const message = `✅ *Pembayaran Berhasil*

Terima kasih, *${order.guestCustomer.name.trim()}*! Pembayaran untuk pesanan Anda telah kami terima.

${details}`;

        await this.sendWhatsAppMessage(order.guestCustomer.phone, message);
    }

    public static async sendOrderStatusUpdate(
        phone: string | null,
        orderId: string,
        status: string
    ) {
        if (!phone) {
            console.log(
                "Tidak ada nomor telepon, notifikasi status pesanan tidak dikirim."
            );
            return;
        }

        const message = `🔔 *Update Status Pesanan*

Status pesanan Anda \`#${orderId}\` telah diperbarui menjadi: *${status}*.`;

        await this.sendWhatsAppMessage(phone, message);
    }

    public static async sendPaymentReminder(
        order: OrderWithDetails,
        transaction: { paymentUrl?: string | null }
    ) {
        if (!order.guestCustomer.phone) return;

        const details = this.formatOrderDetails(order);

        let message = `⏳ *Pengingat Pembayaran*

Hai *${order.guestCustomer.name.trim()}*, pesanan Anda masih menunggu penyelesaian pembayaran.

${details}`;

        if (transaction.paymentUrl) {
            message += `

🔗 *Silakan selesaikan pembayaran Anda melalui link berikut:*  
${transaction.paymentUrl}`;
        } else {
            message += `

Silakan selesaikan pembayaran Anda melalui aplikasi.`;
        }

        await this.sendWhatsAppMessage(order.guestCustomer.phone, message);
    }
}
