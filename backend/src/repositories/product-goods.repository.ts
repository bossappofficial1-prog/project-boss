import { db } from "../config/prisma";
import { Prisma, StockMovementType } from "@prisma/client";

export class ProductGoodsRepository {
  /**
   * Find a ProductGoods by ID with its active batches and logs
   */
  static async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.productGoods.findUnique({
      where: { id },
      include: {
        batches: {
          orderBy: { createdAt: "asc" },
        },
        stockLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        product: true,
      },
    });
  }

  /**
   * Find a ProductGoods by Product ID with its active batches and logs
   */
  static async findByProductId(productId: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.productGoods.findUnique({
      where: { productId },
      include: {
        batches: {
          orderBy: { createdAt: "asc" },
        },
        stockLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        product: true,
      },
    });
  }

  /**
   * Add a new stock batch (IN or RETURN)
   */
  static async addStockBatch(
    productGoodsId: string,
    quantity: number,
    totalCost: number,
    referenceId?: string,
    notes?: string,
    faktur?: string,
    tx?: Prisma.TransactionClient,
    type: StockMovementType = StockMovementType.IN,
    expiryDate?: Date,
  ) {
    const execute = async (client: Prisma.TransactionClient) => {
      const productGoods = await client.productGoods.findUnique({
        where: { id: productGoodsId },
        include: { product: { include: { recipe: true } } },
      });
      if (!productGoods) throw new Error("Product Goods tidak ditemukan");

      const costPerUnit = quantity > 0 ? totalCost / quantity : 0;
      const hasRecipe = !!productGoods.product?.recipe;

      // Buat record batch stok masuk FIFO baru
      const batch = await client.goodsStockBatch.create({
        data: {
          productGoodsId,
          purchaseQuantity: quantity,
          remainingQuantity: quantity,
          costPerUnit,
          expiryDate,
        },
      });

      // Log pergerakan stok masuk
      const stockLog = await client.stockLog.create({
        data: {
          productGoodsId,
          type,
          quantity,
          hppPerUnit: costPerUnit,
          referenceId,
          notes,
          faktur,
        },
      });

      // Ambil seluruh batch aktif untuk kalkulasi estimasi averageHpp saat ini
      const activeBatches = await client.goodsStockBatch.findMany({
        where: { productGoodsId, remainingQuantity: { gt: 0 } },
      });

      let totalRemainingQty = 0;
      let totalRemainingValue = 0;
      for (const b of activeBatches) {
        totalRemainingQty += b.remainingQuantity;
        totalRemainingValue += b.remainingQuantity * b.costPerUnit;
      }

      // Hitung harga rata-rata tertimbang dari batch yang tersisa
      const newAverageHpp = hasRecipe
        ? productGoods.averageHpp
        : (totalRemainingQty > 0
            ? totalRemainingValue / totalRemainingQty
            : costPerUnit);

      const newStock = productGoods.currentStock + quantity;

      // Update stok dan estimasi HPP barang
      const updatedGoods = await client.productGoods.update({
        where: { id: productGoodsId },
        data: {
          currentStock: newStock,
          averageHpp: newAverageHpp,
        },
      });

      return {
        batch,
        stockLog,
        newStock,
        newAverageHpp,
        productGoods: updatedGoods,
      };
    };

    if (tx) {
      return execute(tx);
    } else {
      return db.$transaction(execute);
    }
  }

  /**
   * Deduct stock using First In First Out (FIFO) logic
   */
  static async deductStockFIFO(
    productGoodsId: string,
    qtyNeeded: number,
    referenceId?: string,
    notes?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const execute = async (client: Prisma.TransactionClient) => {
      const productGoods = await client.productGoods.findUnique({
        where: { id: productGoodsId },
      });
      if (!productGoods) throw new Error("Product Goods tidak ditemukan");

      // Ambil batch stok aktif (sisa > 0) diurutkan dari yang paling cepat kedaluwarsa (FEFO)
      const activeBatches = await client.goodsStockBatch.findMany({
        where: { productGoodsId, remainingQuantity: { gt: 0 } },
        orderBy: [
          { expiryDate: { sort: "asc", nulls: "last" } },
          { createdAt: "asc" },
        ],
      });

      let remainingNeeded = qtyNeeded;
      let totalHppCost = 0;
      const updatedBatches: { id: string; remainingQuantity: number }[] = [];

      for (const batch of activeBatches) {
        if (remainingNeeded <= 0) break;

        if (batch.remainingQuantity >= remainingNeeded) {
          // Batch ini mencukupi seluruh kebutuhan sisa
          const newRemaining = batch.remainingQuantity - remainingNeeded;
          totalHppCost += remainingNeeded * batch.costPerUnit;
          updatedBatches.push({ id: batch.id, remainingQuantity: newRemaining });
          remainingNeeded = 0;
        } else {
          // Konsumsi seluruh kuantitas di batch ini
          totalHppCost += batch.remainingQuantity * batch.costPerUnit;
          remainingNeeded -= batch.remainingQuantity;
          updatedBatches.push({ id: batch.id, remainingQuantity: 0 });
        }
      }

      // Kasus Stok Negatif (Kebutuhan melebihi stok yang tersedia)
      if (remainingNeeded > 0) {
        // Ambil batch terbaru untuk menyerap stok negatif tersebut
        const allBatches = await client.goodsStockBatch.findMany({
          where: { productGoodsId },
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
          totalHppCost += remainingNeeded * newestBatch.costPerUnit;

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
          const costUnit = productGoods.averageHpp || 0;
          await client.goodsStockBatch.create({
            data: {
              productGoodsId,
              purchaseQuantity: 0,
              remainingQuantity: -remainingNeeded,
              costPerUnit: costUnit,
            },
          });
          totalHppCost += remainingNeeded * costUnit;
        }
      }

      // Simpan perubahan sisa kuantitas untuk setiap batch terpengaruh
      for (const update of updatedBatches) {
        await client.goodsStockBatch.update({
          where: { id: update.id },
          data: { remainingQuantity: update.remainingQuantity },
        });
      }

      const newStock = productGoods.currentStock - qtyNeeded;

      // Update total stok barang di tabel utama
      const updatedGoods = await client.productGoods.update({
        where: { id: productGoodsId },
        data: { currentStock: newStock },
      });

      // Log pergerakan stok keluar
      const stockLog = await client.stockLog.create({
        data: {
          productGoodsId,
          type: StockMovementType.OUT,
          quantity: -qtyNeeded,
          hppPerUnit: qtyNeeded > 0 ? totalHppCost / qtyNeeded : 0,
          referenceId,
          notes,
        },
      });

      return {
        qtyNeeded,
        actualHppCost: totalHppCost,
        newStock,
        productGoods: updatedGoods,
        stockLog,
      };
    };

    if (tx) {
      return execute(tx);
    } else {
      return db.$transaction(execute);
    }
  }

  /**
   * Log manual stock adjustment (positive or negative)
   */
  static async adjustStock(
    productGoodsId: string,
    quantity: number, // Kuantitas penyesuaian (bisa positif/negatif)
    notes?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const execute = async (client: Prisma.TransactionClient) => {
      const productGoods = await client.productGoods.findUnique({
        where: { id: productGoodsId },
      });
      if (!productGoods) throw new Error("Product Goods tidak ditemukan");

      if (quantity > 0) {
        // Penyesuaian positif: Buat batch baru dengan HPP rata-rata saat ini
        const costPerUnit = productGoods.averageHpp || 0;
        const totalCost = costPerUnit * quantity;

        const result = await this.addStockBatch(
          productGoodsId,
          quantity,
          totalCost,
          undefined,
          notes,
          undefined,
          client,
          StockMovementType.ADJUSTMENT, // Log sebagai tipe ADJUSTMENT
        );

        return {
          quantity,
          newStock: result.newStock,
          productGoods: result.productGoods,
        };
      } else if (quantity < 0) {
        // Penyesuaian negatif: Kurangi stok menggunakan FIFO
        const qtyToDeduct = Math.abs(quantity);
        const result = await this.deductStockFIFO(
          productGoodsId,
          qtyToDeduct,
          undefined,
          notes,
          client,
        );

        // Ganti tipe log dari OUT ke ADJUSTMENT dan pastikan kuantitas negatif
        await client.stockLog.update({
          where: { id: result.stockLog.id },
          data: {
            type: StockMovementType.ADJUSTMENT,
            quantity: quantity,
          },
        });

        return {
          quantity,
          newStock: result.newStock,
          productGoods: result.productGoods,
        };
      }

      return {
        quantity: 0,
        newStock: productGoods.currentStock,
        productGoods,
      };
    };

    if (tx) {
      return execute(tx);
    } else {
      return db.$transaction(execute);
    }
  }
}
