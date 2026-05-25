import { BaseService } from "./base.service";
import { IngredientRepository } from "../repositories/ingredient.repository";
import { RecipeRepository } from "../repositories/recipe.repository";

export class IngredientService extends BaseService {
  static async create(data: {
    name: string;
    purchaseUnit: string;
    recipeUnit: string;
    conversionFactor: number;
    minStock?: number;
    outletId: string;
  }) {
    if (!data.name) this.badRequest("Nama bahan baku wajib diisi");
    if (!data.purchaseUnit) this.badRequest("Satuan pembelian wajib diisi");
    if (!data.recipeUnit) this.badRequest("Satuan resep wajib diisi");
    if (data.conversionFactor <= 0) {
      this.badRequest("Faktor konversi harus lebih besar dari 0");
    }

    return IngredientRepository.create(data);
  }

  static async getById(id: string) {
    const ingredient = await IngredientRepository.findById(id);
    if (!ingredient) this.notFound("Bahan baku tidak ditemukan");
    return ingredient;
  }

  static async getByOutletId(outletId: string) {
    return IngredientRepository.findByOutletId(outletId);
  }

  static async update(
    id: string,
    data: {
      name?: string;
      purchaseUnit?: string;
      recipeUnit?: string;
      conversionFactor?: number;
      minStock?: number | null;
    },
  ) {
    const ingredient = await IngredientRepository.findById(id);
    if (!ingredient) this.notFound("Bahan baku tidak ditemukan");

    if (data.conversionFactor !== undefined && data.conversionFactor <= 0) {
      this.badRequest("Faktor konversi harus lebih besar dari 0");
    }

    return IngredientRepository.update(id, data);
  }

  static async delete(id: string) {
    const ingredient = await IngredientRepository.findById(id);
    if (!ingredient) this.notFound("Bahan baku tidak ditemukan");
    return IngredientRepository.delete(id);
  }

  /**
   * Menambahkan stok bahan baku baru (membuat batch stok masuk FIFO baru)
   * Dan memicu kalkulasi ulang HPP produk yang menggunakan bahan baku ini
   */
  static async addStock(
    ingredientId: string,
    quantity: number, // Kuantitas dalam purchaseUnit
    totalCost: number, // Total biaya pembelian
    referenceId?: string,
    notes?: string,
  ) {
    const ingredient = await IngredientRepository.findById(ingredientId);
    if (!ingredient) this.notFound("Bahan baku tidak ditemukan");

    if (quantity <= 0) this.badRequest("Jumlah stok harus lebih besar dari 0");
    if (totalCost < 0) this.badRequest("Biaya pembelian tidak boleh negatif");

    const result = await IngredientRepository.addStockBatch(
      ingredientId,
      quantity,
      totalCost,
      referenceId,
      notes,
    );

    // Pemicu rekalkulasi otomatis HPP seluruh produk yang menggunakan bahan ini
    await RecipeRepository.recalculateAllProductsUsingIngredient(ingredientId);

    return result;
  }

  /**
   * Penyesuaian stok manual (Adjustment)
   * Dan memicu kalkulasi ulang HPP produk jika ada perubahan estimasi harga
   */
  static async adjustStock(
    ingredientId: string,
    quantity: number, // Kuantitas penyesuaian (bisa positif/negatif) dalam unit resep
    notes?: string,
  ) {
    const ingredient = await IngredientRepository.findById(ingredientId);
    if (!ingredient) this.notFound("Bahan baku tidak ditemukan");

    await IngredientRepository.adjustStock(ingredientId, quantity, notes);

    // Pemicu rekalkulasi otomatis HPP seluruh produk yang menggunakan bahan ini
    await RecipeRepository.recalculateAllProductsUsingIngredient(ingredientId);

    // Ambil data terbaru setelah adjustment
    return IngredientRepository.findById(ingredientId);
  }
}
