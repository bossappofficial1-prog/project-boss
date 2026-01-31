import { StockLog, StockMovementType, Prisma } from "@prisma/client";
import { db } from "../config/prisma";

export class StockLogRepository {
  /**
   * Create a new stock movement log
   */
  static async create(data: {
    productGoodsId: string;
    type: StockMovementType;
    quantity: number;
    hppPerUnit?: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }): Promise<StockLog> {
    return db.stockLog.create({
      data,
    });
  }

  /**
   * Find all stock logs for a product goods
   */
  static async findByProductGoodsId(
    productGoodsId: string,
    filters?: {
      type?: StockMovementType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ): Promise<StockLog[]> {
    const where: Prisma.StockLogWhereInput = {
      productGoodsId,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.startDate || filters?.endDate
        ? {
            createdAt: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {}),
    };

    return db.stockLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(filters?.limit && { take: filters.limit }),
      ...(filters?.offset && { skip: filters.offset }),
    });
  }

  /**
   * Calculate weighted average HPP from all IN movements
   * Formula: Σ(hppPerUnit × quantity) / Σ(quantity)
   */
  static async calculateAverageHpp(productGoodsId: string): Promise<number> {
    const inLogs = await db.stockLog.findMany({
      where: {
        productGoodsId,
        type: StockMovementType.IN,
        hppPerUnit: {
          not: null,
        },
      },
      select: {
        hppPerUnit: true,
        quantity: true,
      },
    });

    if (inLogs.length === 0) {
      return 0;
    }

    const totalWeightedHpp = inLogs.reduce((sum, log) => {
      return sum + (log.hppPerUnit || 0) * log.quantity;
    }, 0);

    const totalQuantity = inLogs.reduce((sum, log) => {
      return sum + log.quantity;
    }, 0);

    if (totalQuantity === 0) {
      return 0;
    }

    return totalWeightedHpp / totalQuantity;
  }

  /**
   * Get total stock IN quantity
   */
  static async getTotalStockIn(productGoodsId: string): Promise<number> {
    const result = await db.stockLog.aggregate({
      where: {
        productGoodsId,
        type: StockMovementType.IN,
      },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }

  /**
   * Get total stock OUT quantity
   */
  static async getTotalStockOut(productGoodsId: string): Promise<number> {
    const result = await db.stockLog.aggregate({
      where: {
        productGoodsId,
        type: StockMovementType.OUT,
      },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }
}
