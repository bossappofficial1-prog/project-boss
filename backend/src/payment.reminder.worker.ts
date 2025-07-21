import { db } from './config/prisma';
import { NotificationService } from './service/notification.service';
import { PaymentStatus } from '@prisma/client';
import { OrderRepository } from './repositories/order.repository';

const CHECK_INTERVAL_MS = 60 * 1000; // Jalankan setiap 1 menit
const REMINDER_BEFORE_EXPIRY_MS = 3 * 60 * 1000; // 3 menit sebelum kedaluwarsa

async function checkExpiringPayments() {
    console.log('[REMINDER WORKER] Mencari pembayaran yang akan segera kedaluwarsa...');

    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + REMINDER_BEFORE_EXPIRY_MS);

    const expiringTransactions = await db.transaction.findMany({
        where: {
            status: PaymentStatus.PENDING,
            expiresAt: {
                gte: now, // Belum kedaluwarsa
                lte: reminderWindowStart, // Akan kedaluwarsa dalam 3 menit ke depan
            },
            order: {
                // Pastikan kita belum mengirim pengingat
                paymentReminderSent: false,
            },
        },
        include: {
            order: true,
        },
    });

    if (expiringTransactions.length === 0) {
        console.log('[REMINDER WORKER] Tidak ada pembayaran yang memerlukan pengingat.');
        return;
    }

    for (const transaction of expiringTransactions) {
        try {
            const orderDetails = await OrderRepository.findById(transaction.orderId);
            if (orderDetails) {
                console.log(`[REMINDER WORKER] Mengirim pengingat untuk Order ID: ${orderDetails.id}`);
                await NotificationService.sendPaymentReminder(orderDetails, transaction);

                // Tandai bahwa pengingat telah dikirim
                await db.order.update({
                    where: { id: orderDetails.id },
                    data: { paymentReminderSent: true },
                });
            }
        } catch (error) {
            console.error(`[REMINDER WORKER] Gagal mengirim pengingat untuk Order ID ${transaction.orderId}:`, error);
        }
    }
}

function startReminderWorker() {
    console.log('[REMINDER WORKER] Worker pengingat pembayaran dimulai.');
    checkExpiringPayments();
    setInterval(checkExpiringPayments, CHECK_INTERVAL_MS);
}

startReminderWorker();
