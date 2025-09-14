import { Router } from 'express';
import {
    getPublicSocketStatsController,
    emitOrderTrackingController,
    emitAnnouncementController,
    publicSocketHealthController
} from '../controller/socket-public.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/health', publicSocketHealthController);
router.get('/stats', protect, authorize(UserRole.ADMIN, UserRole.OWNER), getPublicSocketStatsController);
router.post('/emit-order-tracking', protect, authorize(UserRole.ADMIN, UserRole.OWNER), emitOrderTrackingController);
router.post('/emit-announcement', protect, authorize(UserRole.ADMIN), emitAnnouncementController);

export default router;
