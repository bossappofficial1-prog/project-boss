import { db } from '../config/prisma.js';
import logger from '../utils/pino.logger.js';
import { PaymentStatus } from '@prisma/client';
import { OrderRepository } from '../repositories/order.repository.js';
import { IntegrationService } from '../service/integration.service.js';

const REMINDER_BEFORE_EXPIRY_MS = 3 * 60 * 1000; // 3 menit

export async function checkExpiringPayments() {
    logger.info({ component: 'PaymentReminderWorker' }, 'Mencari pembayaran yang akan segera kedaluwarsa...');

    try {
        const now = new Date();
        const reminderWindowStart = new Date(now.getTime() + REMINDER_BEFORE_EXPIRY_MS);

        const expiringTransactions = await db.transaction.findMany({
            where: {
                status: PaymentStatus.PENDING,
                expiresAt: {
                    gte: now,
                    lte: reminderWindowStart,
                },
                order: {
                    paymentReminderSent: false,
                },
            },
            include: {
                order: {
                    include: {
                        outlet: true,
                    }
                }
            }
        });

        if (!expiringTransactions || expiringTransactions.length === 0) {
            logger.info({ component: 'PaymentReminderWorker' }, 'Tidak ada pembayaran yang memerlukan pengingat.');
            return;
        }

        logger.info({ component: 'PaymentReminderWorker', count: expiringTransactions.length }, `Ditemukan ${expiringTransactions.length} transaksi yang memerlukan pengingat.`);

        for (const transaction of expiringTransactions) {
            const orderId = transaction.orderId;
            try {
                const businessId = transaction.order?.outlet?.businessId;
                if (!businessId) {
                    logger.warn({ component: 'PaymentReminderWorker', orderId }, `Order tidak memiliki businessId atau outlet, pengingat dilewati.`);
                    continue;
                }

                // Get full order details for formatting
                const order = await OrderRepository.findById(orderId);
                if (!order) {
                    logger.warn({ component: 'PaymentReminderWorker', orderId }, `Order tidak ditemukan di repositori.`);
                    continue;
                }

                if (!order.guestCustomer?.phone) {
                    logger.warn({ component: 'PaymentReminderWorker', orderId }, `No phone number for order, reminder not sent.`);
                    continue;
                }

                // Format order details
                const items = (order.items || [])
                    .map((item: any) => `• ${item.product?.name || 'Product'} (x${item.quantity})`)
                    .join("\n");

                const details = `
🧾 *Detail Pesanan*
*No. Order:* \`#${order.id}\`
*Outlet:* ${order.outlet?.name}

🛍️ *Produk:*
${items}

💰 *Total:* *Rp${order.totalAmount.toLocaleString("id-ID")}*
                `.trim();

                let message = `⏳ *Pengingat Pembayaran*

Hai *${order.guestCustomer.name.trim()}*, pesanan Anda masih menunggu penyelesaian pembayaran.

${details}`;

                if (transaction.paymentUrl) {
                    message += `\n\n🔗 *Silakan selesaikan pembayaran Anda melalui link berikut:*\n${transaction.paymentUrl}`;
                } else {
                    message += `\n\nSilakan selesaikan pembayaran Anda melalui aplikasi.`;
                }

                // Send WhatsApp
                const phone = order.guestCustomer.phone;
                const formattedPhone = phone.startsWith("+") ? phone : `+62${phone.substring(1)}`;

                logger.info({ component: 'PaymentReminderWorker', orderId }, `Mengirim pengingat WhatsApp ke ${formattedPhone}`);
                const success = await IntegrationService.sendWhatsAppMessage(businessId, formattedPhone, message);
                
                if (success) {
                    // Mark reminder sent in database
                    await db.order.update({
                        where: { id: orderId },
                        data: { paymentReminderSent: true }
                    });
                    logger.info({ component: 'PaymentReminderWorker', orderId }, `Pengingat WhatsApp berhasil dikirim dan ditandai.`);
                } else {
                    logger.error({ component: 'PaymentReminderWorker', orderId }, `Gagal mengirim WhatsApp via Baileys.`);
                }
            } catch (error: any) {
                logger.error({ component: 'PaymentReminderWorker', orderId, error: error.message }, 'Gagal memproses pengingat pembayaran untuk order');
            }
        }
    } catch (error: any) {
        logger.error({ component: 'PaymentReminderWorker', error: error.message }, 'Gagal melakukan pencarian pembayaran yang kedaluwarsa');
    }
}

class PaymentReminderWorker {
    private isRunning = false;
    private intervalId: NodeJS.Timeout | null = null;

    async start() {
        if (this.isRunning) {
            logger.warn({ component: 'PaymentReminderWorker' }, 'Payment reminder worker already running');
            return;
        }
        this.isRunning = true;
        logger.info({ component: 'PaymentReminderWorker' }, 'Payment reminder scheduler started');

        // Run immediately once
        checkExpiringPayments().catch(err => {
            logger.error({ component: 'PaymentReminderWorker', error: err.message }, 'Error in initial checkExpiringPayments');
        });

        // Setup interval
        this.intervalId = setInterval(() => {
            checkExpiringPayments().catch(err => {
                logger.error({ component: 'PaymentReminderWorker', error: err.message }, 'Error in periodic checkExpiringPayments');
            });
        }, 60 * 1000);
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        logger.info({ component: 'PaymentReminderWorker' }, 'Payment reminder scheduler stopped');
    }
}

export const paymentReminderWorker = new PaymentReminderWorker();
