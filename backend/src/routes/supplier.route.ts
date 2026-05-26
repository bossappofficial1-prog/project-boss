import { Router } from "express";
import { supplierController } from "../controller/supplier.controller";
import { authorize, protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect, authorize("OWNER", "ADMIN", "CASHIER", "MANAGER"));
// Get suppliers for a specific product (before /:id to avoid conflict)
router.get("/by-product/:productGoodsId", supplierController.getByProduct);

// CRUD
router.get("/", supplierController.getAll);
router.get("/:id", supplierController.getById);
router.post("/", supplierController.create);
router.put("/:id", supplierController.update);
router.delete("/:id", supplierController.delete);

export default router;
