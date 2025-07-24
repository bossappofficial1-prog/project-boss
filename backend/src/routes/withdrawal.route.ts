import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
    getWithdrawalCalculationController,
    requestWithdrawalController,
    processWithdrawalController,
    getWithdrawalHistoryController,
    midtransPayoutWebhookController
} from '../controller/withdrawal.controller';

const withdrawalRouter = Router();

// Webhook dari Midtrans tidak memerlukan auth
withdrawalRouter.post('/webhooks/midtrans-payout', midtransPayoutWebhookController);

// Semua endpoint withdrawal memerlukan authentication
withdrawalRouter.use(protect);

// GET /withdrawals/business/:businessId/calculation - Hitung amount yang bisa ditarik
withdrawalRouter.get('/business/:businessId/calculation', getWithdrawalCalculationController);

// POST /withdrawals/business/:businessId/request - Request withdrawal
withdrawalRouter.post('/business/:businessId/request', requestWithdrawalController);

// PATCH /withdrawals/:id/process - Process withdrawal (admin only)
withdrawalRouter.patch('/:id/process', processWithdrawalController);

// GET /withdrawals/business/:businessId/history - Get withdrawal history
withdrawalRouter.get('/business/:businessId/history', getWithdrawalHistoryController);

export { withdrawalRouter };
