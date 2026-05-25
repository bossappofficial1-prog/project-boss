import { db } from "../config/prisma";
import type { IngredientStockLogType } from "@prisma/client";

export class IngredientRepository {
  static async create(data: {
    name: string;
    purchaseUnit: string;
    recipeUnit: string;
    conversionFactor: number;
    minStock?: number;
    outletId: string;
  }) {
    return db.ingredient.create({
      data: {
        name: data.name,
        purchaseUnit: data.purchaseUnit,
        recipeUnit: data.recipeUnit,
        conversionFactor: data.conversionFactor || 1,
        minStock: data.minStock,
        outletId: data.outletId,
      },
    });
  }

  static async findById(id: string) {
    return db.ingredient.findUnique({
      where: { id },
      include: {
        batches: {
          orderBy: { createdAt: "asc" },
        },
        stockLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
  }

  static async findByOutletId(outletId: string) {
    return db.ingredient.findMany({
      where: { outletId },
      orderBy: { name: "asc" },
    });
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
    return db.ingredient.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return db.ingredient.delete({
      where: { id },
    });
  }

  /**
   * Tambah stok bahan baku baru (membuat batch stok masuk FIFO baru)
   */
  static async addStockBatch(
    ingredientId: string,
    quantity: number, // Kuantitas dalam purchaseUnit
    totalCost: number, // Total biaya pembelian
    referenceId?: string,
    notes?: string,
  ) {
    return db.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: ingredientId },
      });
      if (!ingredient) throw new Error("Ingredient tidak ditemukan");

      // Konversi kuantitas pembelian ke unit resep terkecil
      const qtyRecipe = quantity * ingredient.conversionFactor;
      const costPerRecipeUnit = totalCost / qtyRecipe;

      // Buat record batch stok masuk FIFO baru
      const batch = await tx.ingredientStockBatch.create({
        data: {
          ingredientId,
          purchaseQuantity: qtyRecipe,
          remainingQuantity: qtyRecipe,
          costPerRecipeUnit,
        },
      });

      // Log pergerakan stok masuk
      await tx.ingredientStockLog.create({
        data: {
          ingredientId,
          type: "IN",
          quantity: qtyRecipe,
          costPerUnit: costPerRecipeUnit,
          referenceId,
          notes,
        },
      });

      // Ambil seluruh batch aktif untuk kalkulasi estimasi averageCost saat ini
      const activeBatches = await tx.ingredientStockBatch.findMany({
        where: { ingredientId, remainingQuantity: { gt: 0 } },
      });

      let totalRemainingQty = 0;
      let totalRemainingValue = 0;
      for (const b of activeBatches) {
        totalRemainingQty += b.remainingQuantity;
        totalRemainingValue += b.remainingQuantity * b.costPerRecipeUnit;
      }

      // Hitung harga rata-rata tertimbang saat ini
      const newAverageCost =
        totalRemainingQty > 0
          ? totalRemainingValue / totalRemainingQty
          : costPerRecipeUnit;

      const newStock = ingredient.currentStock + qtyRecipe;

      // Update stok dan estimasi harga rata-rata bahan baku
      const updatedIngredient = await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStock: newStock,
          averageCost: newAverageCost,
        },
      });

      return {
        batch,
        newStock,
        newAverageCost,
        ingredient: updatedIngredient,
      };
    });
  }

  /**
   * Pengurangan stok menggunakan metode FIFO (First In First Out)
   */
  static async deductStockFIFO(
    ingredientId: string,
    qtyNeeded: number, // Kuantitas dalam unit resep
    referenceId?: string,
    notes?: string,
  ) {
    return db.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: ingredientId },
      });
      if (!ingredient) throw new Error("Ingredient tidak ditemukan");

      // Ambil batch stok aktif (sisa > 0) diurutkan dari yang paling lama (FIFO)
      const activeBatches = await tx.ingredientStockBatch.findMany({
        where: { ingredientId, remainingQuantity: { gt: 0 } },
        orderBy: { createdAt: "asc" },
      });

      let remainingNeeded = qtyNeeded;
      let totalHppCost = 0;
      const updatedBatches: { id: string; remainingQuantity: number }[] = [];

      for (const batch of activeBatches) {
        if (remainingNeeded <= 0) break;

        if (batch.remainingQuantity >= remainingNeeded) {
          // Batch ini mencukupi seluruh kebutuhan sisa
          const newRemaining = batch.remainingQuantity - remainingNeeded;
          totalHppCost += remainingNeeded * batch.costPerRecipeUnit;
          updatedBatches.push({ id: batch.id, remainingQuantity: newRemaining });
          remainingNeeded = 0;
        } else {
          // Konsumsi seluruh kuantitas di batch ini
          totalHppCost += batch.remainingQuantity * batch.costPerRecipeUnit;
          remainingNeeded -= batch.remainingQuantity;
          updatedBatches.push({ id: batch.id, remainingQuantity: 0 });
        }
      }

      // Kasus Stok Negatif (Kebutuhan melebihi stok yang tersedia)
      if (remainingNeeded > 0) {
        // Ambil batch terbaru untuk menyerap stok negatif tersebut
        const allBatches = await tx.ingredientStockBatch.findMany({
          where: { ingredientId },
          orderBy: { createdAt: "desc" },
          take: 1,
        });

        if (allBatches.length > 0) {
          const newestBatch = allBatches[0];
          const existingUpdateIdx = updatedBatches.findIndex(
            (b) => b.id === newestBatch.id,
          );
          const currentRemaining =
            existingUpdateIdx !== -1
              ? updatedBatches[existingUpdateIdx].remainingQuantity
              : newestBatch.remainingQuantity;

          const newRemaining = currentRemaining - remainingNeeded;
          totalHppCost += remainingNeeded * newestBatch.costPerRecipeUnit;

          if (existingUpdateIdx !== -1) {
            updatedBatches[existingUpdateIdx].remainingQuantity = newRemaining;
          } else {
            updatedBatches.push({
              id: newestBatch.id,
              remainingQuantity: newRemaining,
            });
          }
        } else {
          // Jika belum ada batch sama sekali, buat batch placeholder negatif
          const costUnit = ingredient.averageCost || 0;
          await tx.ingredientStockBatch.create({
            data: {
              ingredientId,
              purchaseQuantity: 0,
              remainingQuantity: -remainingNeeded,
              costPerRecipeUnit: costUnit,
            },
          });
          totalHppCost += remainingNeeded * costUnit;
        }
      }

      // Simpan perubahan sisa kuantitas untuk setiap batch terpengaruh
      for (const update of updatedBatches) {
        await tx.ingredientStockBatch.update({
          where: { id: update.id },
          data: { remainingQuantity: update.remainingQuantity },
        });
      }

      const newStock = ingredient.currentStock - qtyNeeded;

      // Update total stok bahan baku di tabel utama
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: newStock },
      });

      // Log pergerakan stok keluar
      await tx.ingredientStockLog.create({
        data: {
          ingredientId,
          type: "POS_DEDUCTION",
          quantity: -qtyNeeded,
          referenceId,
          notes,
        },
      });

      return {
        qtyNeeded,
        actualHppCost: totalHppCost,
        newStock,
      };
    });
  }

  /**
   * Log penyesuaian stok manual (Adjustment)
   */
  static async adjustStock(
    ingredientId: string,
    quantity: number, // Kuantitas penyesuaian (bisa positif/negatif) dalam unit resep
    notes?: string,
  ) {
    return db.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: ingredientId },
      });
      if (!ingredient) throw new Error("Ingredient tidak ditemukan");

      // Log pergerakan stok adjustment
      await tx.ingredientStockLog.create({
        data: {
          ingredientId,
          type: "ADJUSTMENT",
          quantity,
          notes,
        },
      });

      const newStock = ingredient.currentStock + quantity;

      // Jika ada penyesuaian positif (misal hitung fisik sisa lebih banyak), kita tambahkan sebagai batch stok masuk baru
      if (quantity > 0) {
        await tx.ingredientStockBatch.create({
          data: {
            ingredientId,
            purchaseQuantity: quantity,
            remainingQuantity: quantity,
            costPerRecipeUnit: ingredient.averageCost || 0,
          },
        });
      } else if (quantity < 0) {
        // Jika penyesuaian negatif (misal susut/hilang), kurangi via FIFO
        await this.deductStockFIFO(
          ingredientId,
          Math.abs(quantity),
          undefined,
          notes || "Adjustment stock minus",
        );
        return; // deductStockFIFO sudah mengupdate currentStock & mencatat log, kita langsung keluar.
      }

      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: newStock },
      });
    });
  }
}
