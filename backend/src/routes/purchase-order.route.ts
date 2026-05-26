import { Router } from "express";
import { purchaseOrderController } from "../controller/purchase-order.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

// protect → parse & validate JWT dulu, baru authorize role
router.use(protect, authorize("OWNER", "ADMIN", "MANAGER"));

router.get("/", purchaseOrderController.getAll);
router.get("/:id", purchaseOrderController.getById);
router.put("/:id/items", purchaseOrderController.updateDraftItems);
router.post("/:id/send", purchaseOrderController.sendPO);
router.post("/:id/complete", purchaseOrderController.completePO);

export default router;
