import { StockMovementType } from "@prisma/client";
import { db } from "../config/prisma";
import { StockLogRepository } from "../repositories/stock-log.repository";
import {
  StockInInput,
  StockOutInput,
  StockAdjustmentInput,
  StockReturnInput,
} from "../schemas/stock.schema";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

/**
 * Record incoming stock (purchase/restock)
 * - Creates stock log with type IN
 * - Updates ProductGoods currentStock
 * - Recalculates average HPP
 */
export async function recordStockIn(data: StockInInput) {
  // Verify ProductGoods exists
  const productGoods = await db.productGoods.findUnique({
    where: { id: data.productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  return db.$transaction(async (tx) => {
    // Create stock log
    const stockLog = await tx.stockLog.create({
      data: {
        productGoodsId: data.productGoodsId,
        type: StockMovementType.IN,
        quantity: data.quantity,
        hppPerUnit: data.hppPerUnit,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
        faktur: data.faktur,
      },
    });

    // Update current stock
    const updatedGoods = await tx.productGoods.update({
      where: { id: data.productGoodsId },
      data: {
        currentStock: {
          increment: data.quantity,
        },
      },
    });

    // Recalculate average HPP
    const newAverageHpp = await StockLogRepository.calculateAverageHpp(data.productGoodsId);
    await tx.productGoods.update({
      where: { id: data.productGoodsId },
      data: {
        averageHpp: newAverageHpp,
      },
    });

    return {
      stockLog,
      productGoods: updatedGoods,
      newAverageHpp,
    };
  });
}

/**
 * Record multiple incoming stock in a single transaction
 */
export async function recordStockInBulk(data: StockInInput[]) {
  if (data.length === 0) {
    return [];
  }

  // Use a transaction to ensure all stock movements succeed or fail together
  return db.$transaction(
    async (tx) => {
      const results = [];

      for (const item of data) {
        // Verify ProductGoods exists
        const productGoods = await tx.productGoods.findUnique({
          where: { id: item.productGoodsId },
        });

        if (!productGoods) {
          throw new AppError(
            `Product Goods dengan ID ${item.productGoodsId} tidak ditemukan`,
            HttpStatus.NOT_FOUND,
          );
        }

        // Create stock log
        const stockLog = await tx.stockLog.create({
          data: {
            productGoodsId: item.productGoodsId,
            type: StockMovementType.IN,
            quantity: item.quantity,
            hppPerUnit: item.hppPerUnit,
            referenceType: item.referenceType,
            referenceId: item.referenceId,
            notes: item.notes,
            faktur: item.faktur,
          },
        });

        // Update current stock
        const updatedGoods = await tx.productGoods.update({
          where: { id: item.productGoodsId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
          },
        });

        // Recalculate average HPP
        // Note: We need to use StockLogRepository logic but adapted for transaction context
        // OR we can rely on eventual consistency if heavy, but here we want immediate correct HPP.
        // Since StockLogRepository might use 'db' instance directly, we should ideally duplicate the logic
        // or ensure repository accepts transaction client.
        // For simplicity and correctness in this codebase, let's recalculate manually within TX or assume
        // StockLogRepository uses global db but we just wrote to it in TX... actually if we use global db
        // inside TX for reading logs it might not see the new log yet if isolation level is high,
        // but Prisma usually handles this if we pass tx.
        // Let's reimplement simple Weighted Average logic here using tx to be safe.

        // Get all IN logs (including this new one) to calculate weighted average
        const allInLogs = await tx.stockLog.findMany({
          where: {
            productGoodsId: item.productGoodsId,
            type: "IN",
          },
        });

        let totalValue = 0;
        let totalQty = 0;

        for (const log of allInLogs) {
          const qty = log.quantity;
          const price = log.hppPerUnit || 0;
          totalValue += qty * price;
          totalQty += qty;
        }

        const newAverageHpp = totalQty > 0 ? totalValue / totalQty : 0;

        await tx.productGoods.update({
          where: { id: item.productGoodsId },
          data: {
            averageHpp: newAverageHpp,
          },
        });

        results.push({
          stockLog,
          productGoods: updatedGoods,
          newAverageHpp,
        });
      }

      return results;
    },
    {
      timeout: 20000, // Increase timeout for bulk operations
    },
  );
}

/**
 * Record outgoing stock (manual sale/usage)
 * Note: For order-based stock out, see order service integration
 * - Creates stock log with type OUT
 * - Decreases ProductGoods currentStock
 */
export async function recordStockOut(data: StockOutInput) {
  // Verify ProductGoods exists and has sufficient stock
  const productGoods = await db.productGoods.findUnique({
    where: { id: data.productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  if (productGoods.currentStock < data.quantity) {
    throw new AppError(
      `Stok tidak mencukupi. Stok saat ini: ${productGoods.currentStock}, diminta: ${data.quantity}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return db.$transaction(async (tx) => {
    // Create stock log
    const stockLog = await tx.stockLog.create({
      data: {
        productGoodsId: data.productGoodsId,
        type: StockMovementType.OUT,
        quantity: data.quantity,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
      },
    });

    // Decrease current stock
    const updatedGoods = await tx.productGoods.update({
      where: { id: data.productGoodsId },
      data: {
        currentStock: {
          decrement: data.quantity,
        },
      },
    });

    return {
      stockLog,
      productGoods: updatedGoods,
    };
  });
}

/**
 * Manual stock adjustment (positive or negative)
 * - Creates stock log with type ADJUSTMENT
 * - Adjusts ProductGoods currentStock
 */
export async function adjustStock(data: StockAdjustmentInput) {
  // Verify ProductGoods exists
  const productGoods = await db.productGoods.findUnique({
    where: { id: data.productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  const newStock = productGoods.currentStock + data.quantity;
  if (newStock < 0) {
    throw new AppError(
      `Adjustment menghasilkan stok negatif. Stok saat ini: ${productGoods.currentStock}, adjustment: ${data.quantity}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return db.$transaction(async (tx) => {
    // Create stock log
    const stockLog = await tx.stockLog.create({
      data: {
        productGoodsId: data.productGoodsId,
        type: StockMovementType.ADJUSTMENT,
        quantity: data.quantity,
        notes: data.notes,
      },
    });

    // Adjust current stock
    const updatedGoods = await tx.productGoods.update({
      where: { id: data.productGoodsId },
      data: {
        currentStock: newStock,
      },
    });

    return {
      stockLog,
      productGoods: updatedGoods,
    };
  });
}

/**
 * Record stock return (customer return/defective goods return)
 * - Creates stock log with type RETURN
 * - Increases ProductGoods currentStock
 */
export async function recordReturn(data: StockReturnInput) {
  // Verify ProductGoods exists
  const productGoods = await db.productGoods.findUnique({
    where: { id: data.productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  return db.$transaction(async (tx) => {
    // Create stock log
    const stockLog = await tx.stockLog.create({
      data: {
        productGoodsId: data.productGoodsId,
        type: StockMovementType.RETURN,
        quantity: data.quantity,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
      },
    });

    // Increase current stock
    const updatedGoods = await tx.productGoods.update({
      where: { id: data.productGoodsId },
      data: {
        currentStock: {
          increment: data.quantity,
        },
      },
    });

    return {
      stockLog,
      productGoods: updatedGoods,
    };
  });
}

/**
 * Get stock movement history for a product
 */
export async function getStockHistory(
  productGoodsId: string,
  filters?: {
    type?: StockMovementType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  },
) {
  // Verify ProductGoods exists
  const productGoods = await db.productGoods.findUnique({
    where: { id: productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  const logs = await StockLogRepository.findByProductGoodsId(productGoodsId, filters);

  return {
    productGoods,
    logs,
    total: logs.length,
  };
}

/**
 * Get products with low stock (currentStock <= minStock)
 */
export async function getLowStockProducts(outletId: string) {
  const products = await db.product.findMany({
    where: {
      outletId,
      type: "GOODS",
      goods: {
        OR: [
          {
            // When minStock is set and currentStock <= minStock
            AND: [
              { minStock: { not: null } },
              { currentStock: { lte: db.productGoods.fields.minStock } },
            ],
          },
        ],
      },
    },
    include: {
      goods: true,
    },
  });

  // Filter in application layer for safety (complex Prisma query might fail)
  const lowStockProducts = products.filter((product) => {
    if (!product.goods) return false;
    if (product.goods.minStock === null) return false;
    return product.goods.currentStock <= product.goods.minStock;
  });

  return lowStockProducts;
}

/**
 * Manually recalculate HPP for a product goods
 * Useful for data corrections or audits
 */
export async function recalculateHpp(productGoodsId: string) {
  // Verify ProductGoods exists
  const productGoods = await db.productGoods.findUnique({
    where: { id: productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  const newAverageHpp = await StockLogRepository.calculateAverageHpp(productGoodsId);

  const updated = await db.productGoods.update({
    where: { id: productGoodsId },
    data: {
      averageHpp: newAverageHpp,
    },
  });

  return {
    productGoods: updated,
    previousHpp: productGoods.averageHpp,
    newHpp: newAverageHpp,
  };
}
