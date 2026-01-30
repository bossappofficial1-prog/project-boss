import { Router } from 'express';
import { getFinancialSummaryController, getOutletReportController } from '../controller/report.controller';
import { getDailyReportController } from '../controller/daily-report.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/financial-summary', getFinancialSummaryController);
router.get('/daily/:outletId', getDailyReportController);
router.get('/outlet/:outletId', getOutletReportController);

export default router;
