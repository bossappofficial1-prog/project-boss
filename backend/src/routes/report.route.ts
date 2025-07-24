import { Router } from 'express';
import { getFinancialSummaryController } from '../controller/report.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/financial-summary', getFinancialSummaryController);

export default router;
