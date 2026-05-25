import { db } from "../config/prisma";

export class RecipeRepository {
  static async create(productId: string, notes?: string) {
    return db.recipe.create({
      data: {
        productId,
        notes,
      },
    });
  }

  static async findByProductId(productId: string) {
    return db.recipe.findUnique({
      where: { productId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });
  }

  static async updateNotes(recipeId: string, notes: string | null) {
    return db.recipe.update({
      where: { id: recipeId },
      data: { notes },
    });
  }

  static async delete(id: string) {
    return db.recipe.delete({
      where: { id },
    });
  }

  /**
   * Tambah bahan baku ke resep (RecipeIngredient)
   */
  static async addIngredient(
    recipeId: string,
    ingredientId: string,
    quantity: number, // Kuantitas dalam unit resep terkecil
  ) {
    const item = await db.recipeIngredient.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId,
          ingredientId,
        },
      },
      update: { quantity },
      create: {
        recipeId,
        ingredientId,
        quantity,
      },
    });

    // Jalankan rekalkulasi HPP untuk produk pemilik resep ini
    await this.recalculateProductHppByRecipeId(recipeId);

    return item;
  }

  /**
   * Hapus bahan baku dari resep
   */
  static async removeIngredient(recipeId: string, ingredientId: string) {
    const deleted = await db.recipeIngredient.delete({
      where: {
        recipeId_ingredientId: {
          recipeId,
          ingredientId,
        },
      },
    });

    // Jalankan rekalkulasi HPP untuk produk pemilik resep ini
    await this.recalculateProductHppByRecipeId(recipeId);

    return deleted;
  }

  /**
   * Mengambil detail resep beserta bahan dan takaran
   */
  static async getRecipeDetails(recipeId: string) {
    return db.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });
  }

  /**
   * Hitung ulang estimasi HPP produk berdasarkan bahan baku penyusun resepnya
   */
  static async recalculateProductHppByRecipeId(recipeId: string) {
    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) return 0;

    let estimatedHpp = 0;
    for (const ri of recipe.ingredients) {
      // HPP = Kuantitas Resep * Rata-rata biaya per unit resep bahan baku
      estimatedHpp += ri.quantity * ri.ingredient.averageCost;
    }

    // Bulatkan hasil estimasi HPP
    const roundedHpp = Math.round(estimatedHpp * 100) / 100;

    // Sinkronkan ke ProductGoods averageHpp jika product type adalah GOODS
    const product = await db.product.findUnique({
      where: { id: recipe.productId },
      include: { goods: true },
    });

    if (product?.goods) {
      await db.productGoods.update({
        where: { id: product.goods.id },
        data: { averageHpp: roundedHpp },
      });
    }

    return roundedHpp;
  }

  /**
   * Memicu rekalkulasi HPP produk untuk seluruh resep yang menggunakan suatu bahan baku.
   * Sangat berguna jika harga beli bahan baku berubah (stok masuk baru / adjustment).
   */
  static async recalculateAllProductsUsingIngredient(ingredientId: string) {
    // Cari seluruh resep-bahan yang menggunakan ingredientId ini
    const recipeIngredients = await db.recipeIngredient.findMany({
      where: { ingredientId },
      select: { recipeId: true },
    });

    const recipeIds = Array.from(new Set(recipeIngredients.map((ri) => ri.recipeId)));

    // Jalankan kalkulasi ulang HPP untuk setiap resep terkait
    for (const recipeId of recipeIds) {
      await this.recalculateProductHppByRecipeId(recipeId);
    }
  }
}
