import { Router } from "express";
import {
  stockInController,
  stockInBulkController,
  stockOutController,
  stockAdjustmentController,
  stockReturnController,
  stockReturnBulkController,
  getStockHistoryController,
  getLowStockController,
  getHighStockController,
  recalculateHppController,
  getStockOverviewController,
  exportStockController,
} from "../controller/stock.controller";
import { stockInBulkSchema } from "../schemas/stock.schema";

const router = Router();

// Stock movement endpoints
router.post("/in", stockInController);
router.post("/in-bulk", stockInBulkController);
router.post("/out", stockOutController);
router.post("/adjust", stockAdjustmentController);
router.post("/return", stockReturnController);
router.post("/return-bulk", stockReturnBulkController);

// Stock query endpoints
router.get("/history/:productGoodsId", getStockHistoryController);
router.get("/low-stock/:outletId", getLowStockController);
router.get("/high-stock/:outletId", getHighStockController);
router.get("/overview/:outletId", getStockOverviewController);
router.get("/export/:outletId", exportStockController);

// Stock maintenance endpoints
router.post("/recalculate-hpp/:productGoodsId", recalculateHppController);

export default router;
