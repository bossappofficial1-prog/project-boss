import { BaseService } from "./base.service";
import { RecipeRepository } from "../repositories/recipe.repository";
import { ProductRepository } from "../repositories/product.repository";
import { IngredientRepository } from "../repositories/ingredient.repository";

export class RecipeService extends BaseService {
  static async createRecipe(productId: string, notes?: string) {
    // Pastikan produk ada
    const product = await ProductRepository.findById(productId);
    if (!product) this.notFound("Produk tidak ditemukan");

    // Pastikan produk belum memiliki resep terdaftar
    const existingRecipe = await RecipeRepository.findByProductId(productId);
    if (existingRecipe) {
      this.conflict("Produk ini sudah memiliki resep terdaftar");
    }

    return RecipeRepository.create(productId, notes);
  }

  static async getRecipeByProductId(productId: string) {
    const recipe = await RecipeRepository.findByProductId(productId);
    if (!recipe) this.notFound("Resep untuk produk ini tidak ditemukan");
    return recipe;
  }

  static async addIngredientToRecipe(
    recipeId: string,
    ingredientId: string,
    quantity: number, // Kuantitas dalam unit resep terkecil
  ) {
    const recipe = await RecipeRepository.getRecipeDetails(recipeId);
    if (!recipe) this.notFound("Resep tidak ditemukan");

    const ingredient = await IngredientRepository.findById(ingredientId);
    if (!ingredient) this.notFound("Bahan baku tidak ditemukan");

    if (quantity <= 0) {
      this.badRequest("Kuantitas bahan dalam resep harus lebih besar dari 0");
    }

    return RecipeRepository.addIngredient(recipeId, ingredientId, quantity);
  }

  static async removeIngredientFromRecipe(recipeId: string, ingredientId: string) {
    const recipe = await RecipeRepository.getRecipeDetails(recipeId);
    if (!recipe) this.notFound("Resep tidak ditemukan");

    const ingredient = await IngredientRepository.findById(ingredientId);
    if (!ingredient) this.notFound("Bahan baku tidak ditemukan");

    return RecipeRepository.removeIngredient(recipeId, ingredientId);
  }

  static async updateRecipeNotes(recipeId: string, notes: string | null) {
    const recipe = await RecipeRepository.getRecipeDetails(recipeId);
    if (!recipe) this.notFound("Resep tidak ditemukan");

    return RecipeRepository.updateNotes(recipeId, notes);
  }

  static async deleteRecipe(id: string) {
    const recipe = await RecipeRepository.getRecipeDetails(id);
    if (!recipe) this.notFound("Resep tidak ditemukan");

    return RecipeRepository.delete(id);
  }
}
