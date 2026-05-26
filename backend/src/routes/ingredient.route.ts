import { Router } from "express";
import { ingredientController } from "../controller/ingredient.controller";
import { protect } from "../middleware/auth.middleware";
import { authorizeOwnerOrManagerPrivilege } from "../middleware/privilege.middleware";
import { StaffPrivilegeType } from "@prisma/client";

const router = Router();

router.use(protect);
router.use(authorizeOwnerOrManagerPrivilege(StaffPrivilegeType.INGREDIENT_MANAGEMENT));

router.post("/", ingredientController.create);
router.get("/:id", ingredientController.getById);
router.get("/outlet/:outletId", ingredientController.getByOutletId);
router.put("/:id", ingredientController.update);
router.delete("/:id", ingredientController.delete);

// Tambah stok & adjustment
router.post("/:id/stock", ingredientController.addStock);
router.post("/:id/adjust", ingredientController.adjustStock);

export default router;
