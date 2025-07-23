import { Router } from 'express';
import { validateSchema } from '../middleware/zod.middleware';
import { createPromoSchema, applyPromoSchema } from '../schemas/promo.schema';
import { createPromoHandler, getPromosByBusinessHandler, getPromoByIdHandler, applyPromoHandler } from '../controller/promo.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Owner routes
router.post(
    '/',
    protect,
    authorize('OWNER'),
    validateSchema(createPromoSchema),
    createPromoHandler
);

router.get(
    '/business/:businessId',
    protect,
    authorize('OWNER'),
    getPromosByBusinessHandler
);

router.get(
    '/:promoId',
    protect,
    authorize('OWNER'),
    getPromoByIdHandler
);

// Public/Customer route
router.post(
    '/apply',
    validateSchema(applyPromoSchema),
    applyPromoHandler
);

export default router;
