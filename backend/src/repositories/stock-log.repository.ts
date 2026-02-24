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

  /**
   * Get stock overview stats for an outlet
   */
  static async getOutletOverview(outletId: string) {
    const products = await db.product.findMany({
      where: { outletId, type: "GOODS", status: "ACTIVE" },
      include: { goods: true },
    });

    let totalProducts = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of products) {
      if (!product.goods) continue;
      totalProducts++;
      totalStockValue += product.goods.currentStock * product.goods.averageHpp;
      if (product.goods.currentStock === 0) {
        outOfStockCount++;
      } else if (
        product.goods.minStock !== null &&
        product.goods.currentStock <= product.goods.minStock
      ) {
        lowStockCount++;
      }
    }

    // Recent movement counts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const productGoodsIds = products
      .filter((p) => p.goods)
      .map((p) => p.goods!.id);

    const recentMovements = productGoodsIds.length > 0
      ? await db.stockLog.groupBy({
        by: ["type"],
        where: {
          productGoodsId: { in: productGoodsIds },
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { quantity: true },
        _count: true,
      })
      : [];

    const movementSummary: Record<string, { count: number; totalQty: number }> = {};
    for (const m of recentMovements) {
      movementSummary[m.type] = {
        count: m._count,
        totalQty: m._sum.quantity || 0,
      };
    }

    return {
      totalProducts,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      recentMovements: movementSummary,
    };
  }

  /**
   * Get all products with their stock logs for Excel export
   */
  static async getExportData(outletId: string) {
    const products = await db.product.findMany({
      where: { outletId, type: "GOODS", status: "ACTIVE" },
      include: {
        goods: {
          include: {
            stockLogs: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return products.filter((p) => p.goods !== null);
  }
}
