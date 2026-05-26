import { Router } from "express";
import { recipeController } from "../controller/recipe.controller";
import { protect } from "../middleware/auth.middleware";
import { authorizeOwnerOrManagerPrivilege } from "../middleware/privilege.middleware";
import { StaffPrivilegeType } from "@prisma/client";

const router = Router();

router.use(protect);
router.use(authorizeOwnerOrManagerPrivilege(StaffPrivilegeType.RECIPE_MANAGEMENT));

router.post("/", recipeController.create);
router.get("/product/:productId", recipeController.getByProductId);
router.post("/:recipeId/ingredient", recipeController.addIngredient);
router.delete("/:recipeId/ingredient/:ingredientId", recipeController.removeIngredient);
router.put("/:recipeId/notes", recipeController.updateNotes);
router.delete("/:id", recipeController.delete);

export default router;
