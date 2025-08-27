import { Router } from 'express';
import {
    getSocketStatsController,
    testEmitController,
    getBusinessSocketsController
} from '../controller/socket.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Semua route socket memerlukan authentication
router.use(protect);
router.get('/stats', authorize(UserRole.ADMIN, UserRole.OWNER), getSocketStatsController);
router.get('/business/:businessId/sockets', authorize(UserRole.ADMIN, UserRole.OWNER), getBusinessSocketsController);
router.post('/test-emit', authorize(UserRole.ADMIN), testEmitController);

export default router;
