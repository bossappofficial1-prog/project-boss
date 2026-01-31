import { Router } from "express";
import {
  stockInController,
  stockOutController,
  stockAdjustmentController,
  stockReturnController,
  getStockHistoryController,
  getLowStockController,
  recalculateHppController,
} from "../controller/stock.controller";

const router = Router();

// Stock movement endpoints
router.post("/in", stockInController);
router.post("/out", stockOutController);
router.post("/adjust", stockAdjustmentController);
router.post("/return", stockReturnController);

// Stock query endpoints
router.get("/history/:productGoodsId", getStockHistoryController);
router.get("/low-stock/:outletId", getLowStockController);

// Stock maintenance endpoints
router.post("/recalculate-hpp/:productGoodsId", recalculateHppController);

export default router;
