import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import {
    getExpiringTransactions,
    markReminderSent,
    getOrderDetails,
    getOutletQueue,
    updatePaymentStatus,
} from '../controller/internal-api.controller';
import { sendQueueNotification } from '../controller/queue-notification.controller';
import { asyncHandler } from '../middleware/error.middleware';
import { messagePublisher } from '../service/message-publisher.service';
import { ResponseUtil } from '../utils/response';
import { createPosOrderController, getPosCashSummaryController } from '../controller/pos-order.controller';
import { validateSchema } from '../middleware/zod.middleware';
import { createPosOrderSchema } from '../schemas/pos-order.schema';
import { authorize, protect, authorizeOwnerOrCashier } from '../middleware/auth.middleware';

const router = Router();

// Endpoint untuk mendapatkan transaksi yang akan kedaluwarsa
router.get('/expiring-transactions', getExpiringTransactions);

// Endpoint POS untuk kasir dashboard
router.post(
    '/pos/orders',
    protect,
    authorizeOwnerOrCashier,
    validateSchema(createPosOrderSchema),
    createPosOrderController,
);

router.get(
    '/pos/orders/cash-summary',
    protect,
    authorizeOwnerOrCashier,
    getPosCashSummaryController,
);

// Endpoint untuk menandai bahwa pengingat telah dikirim
router.post('/order/:orderId/mark-reminder-sent', markReminderSent);

// Endpoint untuk mendapatkan detail pesanan
router.get('/order/:orderId', getOrderDetails);

// Endpoint untuk mendapatkan antrian outlet
router.get('/outlet-queue/:outletId', getOutletQueue);

// Endpoint untuk consumer memperbarui status pembayaran
router.post('/orders/update-payment-status', updatePaymentStatus);

// Endpoint test untuk WhatsApp notification
router.post('/test/whatsapp', asyncHandler(async (req: Request, res: Response) => {
    const { orderId, phoneNumber } = req.body;
    console.log(`🧪 Testing WhatsApp notification for order: ${orderId || 'TEST123'}`);

    try {
        // Publish WhatsApp message langsung tanpa perlu data order
        await messagePublisher.publishWhatsAppPaymentSuccess(orderId || 'TEST123');
        console.log(`📱 Published WhatsApp payment success notification for test order ${orderId || 'TEST123'}`);
    } catch (error) {
        console.error('❌ Error publishing WhatsApp test notification:', error);
        return ResponseUtil.error(res, 'Failed to send WhatsApp notification', undefined, 500);
    }

    return ResponseUtil.success(res, { message: 'WhatsApp test notification sent' });
}));// Endpoint untuk mengirim notifikasi posisi antrian
router.post('/send-queue-notification', sendQueueNotification);

export default router;
