import { apiClient } from './lib/api-client';
import logger from './utils/logger';
import { config } from './config';
import { NotificationService } from './service/notification.service';

const CHECK_INTERVAL_MS = 60 * 1000; // Jalankan setiap 1 menit

// Tipe data untuk transaksi yang diterima dari API
// Ini harus cocok dengan data yang dikirim oleh endpoint getExpiringTransactions
interface TransactionWithOrderDetails {
    id: string;
    orderId: string;
    paymentUrl?: string | null;
    order: {
        id: string;
        outlet: { name: string; businessId?: string };
        items: { product: { name: string }; quantity: number }[];
        totalAmount: number;
        guestCustomer: { name: string; phone: string | null };
    };
}

async function checkExpiringPayments() {
    logger.info('Mencari pembayaran yang akan segera kedaluwarsa...', {
        component: 'PaymentReminderWorker',
        event: 'check_start'
    });

    try {
        // 1. Panggil API backend untuk mendapatkan transaksi yang akan kedaluwarsa
        const response = await apiClient.get('/internal/expiring-transactions');
        const expiringTransactions = response.data.data; // response.data adalah {success, data, ...}, jadi .data.data

        logger.info(`API Response: ${JSON.stringify(response.data)}`, {
            component: 'PaymentReminderWorker',
            event: 'api_response'
        });

        if (!expiringTransactions || expiringTransactions.length === 0) {
            logger.info('Tidak ada pembayaran yang memerlukan pengingat.', {
                component: 'PaymentReminderWorker',
                event: 'no_reminders_needed'
            });
            return;
        }

        logger.info(`Ditemukan ${expiringTransactions.length} transaksi yang memerlukan pengingat.`, {
            component: 'PaymentReminderWorker',
            event: 'reminders_found',
            count: expiringTransactions.length
        });

        for (const transaction of expiringTransactions) {
            try {
                logger.info(`Mengirim pengingat untuk Order ID: ${transaction.orderId}`, {
                    component: 'PaymentReminderWorker',
                    event: 'send_reminder_start',
                    orderId: transaction.orderId
                });

                // 2. Panggil NotificationService LOKAL untuk mengirim pengingat
                await NotificationService.sendPaymentReminder(transaction.order, transaction, transaction.order.outlet?.businessId);

                // 3. Panggil API backend untuk menandai pengingat telah dikirim
                await apiClient.post(`/internal/order/${transaction.orderId}/mark-reminder-sent`);

                logger.info(`Pengingat untuk Order ID ${transaction.orderId} berhasil dikirim.`, {
                    component: 'PaymentReminderWorker',
                    event: 'send_reminder_success',
                    orderId: transaction.orderId
                });

            } catch (error: any) {
                logger.error(`Gagal memproses pengingat untuk Order ID ${transaction.orderId}`, {
                    component: 'PaymentReminderWorker',
                    event: 'reminder_processing_failed',
                    orderId: transaction.orderId,
                    error: error.response?.data || error.message
                });
            }
        }
    } catch (error: any) {
        logger.error('Gagal mengambil data transaksi dari backend API', {
            component: 'PaymentReminderWorker',
            event: 'api_fetch_failed',
            error: error.response?.data || error.message,
            url: `${config.BACKEND_API_URL}/internal/expiring-transactions`
        });
    }
}

function startReminderWorker() {
    logger.info('Worker pengingat pembayaran dimulai.', {
        component: 'PaymentReminderWorker',
        event: 'worker_start'
    });
    checkExpiringPayments(); // Jalankan sekali saat mulai
}

// Mulai worker
startReminderWorker();
