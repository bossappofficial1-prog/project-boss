import { Router } from "express";
import { getContainer } from "../container";
import { getDailyReportController } from "../controller/daily-report.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

const resolveReport = () => getContainer().resolve("reportController");

router.get("/financial-summary", (req, res) => resolveReport().getFinancialSummary(req, res));
router.get("/daily/:outletId", getDailyReportController);
router.get("/compare", (req, res) => resolveReport().getCompareOutletsReport(req, res));
router.get("/outlet/:outletId", (req, res) => resolveReport().getOutletReport(req, res));
router.get("/staff/:outletId", (req, res) => resolveReport().getStaffReport(req, res));
router.get("/export/outlet/:outletId", (req, res) => resolveReport().exportOutletReportExcel(req, res));
router.get("/export/staff/:outletId", (req, res) => resolveReport().exportStaffReportExcel(req, res));
router.post("/export-transaction", (req, res) => resolveReport().exportTransactionReport(req, res));

export default router;
