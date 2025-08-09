import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import {
    getWithdrawalCalculationController,
    requestWithdrawalController,
    processWithdrawalController,
    getWithdrawalHistoryController
} from '../controller/withdrawal.controller';

const withdrawalRouter = Router();

// Semua endpoint withdrawal memerlukan authentication
withdrawalRouter.use(protect);

// GET /withdrawals/business/:businessId/calculation - Hitung amount yang bisa ditarik
withdrawalRouter.get('/business/:businessId/calculation', getWithdrawalCalculationController);

// POST /withdrawals/business/:businessId/request - Request withdrawal
withdrawalRouter.post('/business/:businessId/request', requestWithdrawalController);

// PATCH /withdrawals/:id/process - Process withdrawal (admin only)
withdrawalRouter.patch('/:id/process', authorize(UserRole.ADMIN), processWithdrawalController);

// GET /withdrawals/business/:businessId/history - Get withdrawal history
withdrawalRouter.get('/business/:businessId/history', getWithdrawalHistoryController);

export { withdrawalRouter };
