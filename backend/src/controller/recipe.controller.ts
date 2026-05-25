import { BaseController } from "./base.controller";
import { RecipeService } from "../service/recipe.service";

class RecipeController extends BaseController {
  create = this.handler(async (req, res) => {
    const { productId, notes } = req.body;
    const data = await RecipeService.createRecipe(productId, notes);
    return this.success(res, data, 201, "Resep berhasil dibuat");
  });

  getByProductId = this.handler(async (req, res) => {
    const { productId } = req.params;
    const data = await RecipeService.getRecipeByProductId(productId as string);
    return this.success(res, data);
  });

  addIngredient = this.handler(async (req, res) => {
    const { recipeId } = req.params;
    const { ingredientId, quantity } = req.body;
    const data = await RecipeService.addIngredientToRecipe(
      recipeId as string,
      ingredientId,
      Number(quantity),
    );
    return this.success(res, data, 200, "Bahan baku berhasil ditambahkan ke resep");
  });

  removeIngredient = this.handler(async (req, res) => {
    const { recipeId, ingredientId } = req.params;
    await RecipeService.removeIngredientFromRecipe(recipeId as string, ingredientId as string);
    return this.success(res, null, 200, "Bahan baku berhasil dihapus dari resep");
  });

  updateNotes = this.handler(async (req, res) => {
    const { recipeId } = req.params;
    const { notes } = req.body;
    const data = await RecipeService.updateRecipeNotes(recipeId as string, notes);
    return this.success(res, data, 200, "Catatan resep berhasil diperbarui");
  });

  delete = this.handler(async (req, res) => {
    const { id } = req.params;
    await RecipeService.deleteRecipe(id as string);
    return this.success(res, null, 200, "Resep berhasil dihapus");
  });
}

export const recipeController = new RecipeController();
