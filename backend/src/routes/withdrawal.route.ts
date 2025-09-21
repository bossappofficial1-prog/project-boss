import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import {
    getWithdrawalCalculationController,
    requestWithdrawalController,
    processWithdrawalController,
    getWithdrawalHistoryController,
    getAllWithdrawalsController,
    getWithdrawalStatsController,
    bulkProcessWithdrawalsController
} from '../controller/withdrawal.controller';

const withdrawalRouter = Router();

// === TEST ENDPOINTS (REMOVE IN PRODUCTION) ===
withdrawalRouter.get('/admin/test-stats', getWithdrawalStatsController);
withdrawalRouter.get('/admin/test-all', getAllWithdrawalsController);

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

// === ADMIN ENDPOINTS ===

// GET /withdrawals/admin/all - Get all withdrawals with pagination and filters (admin only)
withdrawalRouter.get('/admin/all', authorize(UserRole.ADMIN), getAllWithdrawalsController);

// GET /withdrawals/admin/stats - Get withdrawal statistics (admin only)
withdrawalRouter.get('/admin/stats', authorize(UserRole.ADMIN), getWithdrawalStatsController);

// POST /withdrawals/admin/bulk-process - Bulk approve/reject withdrawals (admin only)
withdrawalRouter.post('/admin/bulk-process', authorize(UserRole.ADMIN), bulkProcessWithdrawalsController);

// === TEST ENDPOINTS (REMOVE IN PRODUCTION) ===
withdrawalRouter.get('/admin/test-stats', getWithdrawalStatsController);
withdrawalRouter.get('/admin/test-all', getAllWithdrawalsController);

export { withdrawalRouter };
