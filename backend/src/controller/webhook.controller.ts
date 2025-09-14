import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { messagePublisher } from '../service/message-publisher.service';
import { ResponseUtil } from '../utils/response';

export const handleMidtransWebhook = asyncHandler(async (req: Request, res: Response) => {
    const notificationPayload = req.body;

    // Terbitkan seluruh payload notifikasi ke RabbitMQ
    await messagePublisher.publishPaymentWebhookReceived(notificationPayload, 'midtrans');
    // Langsung balas 200 OK
    return ResponseUtil.success(res, { message: 'Webhook received' });
});
