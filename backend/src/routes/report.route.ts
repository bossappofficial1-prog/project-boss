import { Router } from "express";
import { getContainer } from "../container";
import { getDailyReportController } from "../controller/daily-report.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

const resolveReport = () => getContainer().resolve("reportController");

router.get("/financial-summary", resolveReport().getFinancialSummary);
router.get("/daily/:outletId", getDailyReportController);
router.get("/compare", resolveReport().getCompareOutletsReport);
router.get("/outlet/:outletId", resolveReport().getOutletReport);
router.get("/staff/:outletId", resolveReport().getStaffReport);
router.get("/export/outlet/:outletId", resolveReport().exportOutletReportExcel);
router.get("/export/staff/:outletId", resolveReport().exportStaffReportExcel);
router.post("/export-transaction", resolveReport().exportTransactionReport);

export default router;
