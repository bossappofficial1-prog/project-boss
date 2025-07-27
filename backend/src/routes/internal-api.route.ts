import { Router } from 'express';
import {
    getExpiringTransactions,
    markReminderSent,
    getOrderDetails,
    getOutletQueue
} from '../controller/internal-api.controller';

const router = Router();

// Endpoint untuk mendapatkan transaksi yang akan kedaluwarsa
router.get('/expiring-transactions', getExpiringTransactions);

// Endpoint untuk menandai bahwa pengingat telah dikirim
router.post('/order/:orderId/mark-reminder-sent', markReminderSent);

// Endpoint untuk mendapatkan detail pesanan
router.get('/order/:orderId', getOrderDetails);

// Endpoint untuk mendapatkan antrian outlet
router.get('/outlet-queue/:outletId', getOutletQueue);

export default router;
