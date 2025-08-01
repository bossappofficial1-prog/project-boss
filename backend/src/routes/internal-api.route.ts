import { Router } from 'express';
import {
    getExpiringTransactions,
    markReminderSent,
    getOrderDetails,
    getOutletQueue,
    updatePaymentStatus,
} from '../controller/internal-api.controller';
import { sendQueueNotification } from '../controller/queue-notification.controller';

const router = Router();

// Endpoint untuk mendapatkan transaksi yang akan kedaluwarsa
router.get('/expiring-transactions', getExpiringTransactions);

// Endpoint untuk menandai bahwa pengingat telah dikirim
router.post('/order/:orderId/mark-reminder-sent', markReminderSent);

// Endpoint untuk mendapatkan detail pesanan
router.get('/order/:orderId', getOrderDetails);

// Endpoint untuk mendapatkan antrian outlet
router.get('/outlet-queue/:outletId', getOutletQueue);

// Endpoint untuk consumer memperbarui status pembayaran
router.post('/orders/update-payment-status', updatePaymentStatus);

// Endpoint untuk mengirim notifikasi posisi antrian
router.post('/send-queue-notification', sendQueueNotification);

export default router;
