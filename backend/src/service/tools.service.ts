import {
  OutletRepository,
  RawOrderItem,
} from "../repositories/outlet.repository";


export interface ProductProfitItem {
  productId: string;
  productName: string;
  image: string | null;
  unit: string;
  totalQtySold: number;
  totalRevenue: number;
  totalHppCost: number;
  totalProfit: number;
  marginPercentage: number;
  avgSellingPrice: number;
  avgHpp: number;
  contribution: number;
}

export interface ProfitPerProductResult {
  period: { startDate: string; endDate: string };
  summary: {
    totalRevenue: number;
    totalHppCost: number;
    totalProfit: number;
    avgMarginPercentage: number;
    totalQtySold: number;
    totalOrders: number;
  };
  products: ProductProfitItem[];
}

type HealthStatus = "healthy" | "warning" | "danger";
type Grade = "A" | "B" | "C" | "D";

export interface BusinessHealthResult {
  period: { startDate: string; endDate: string };
  overallScore: number;
  grade: Grade;
  metrics: {
    revenue: {
      score: number;
      status: HealthStatus;
      current: number;
      previous: number;
      growthRate: number;
      totalOrders: number;
      avgTransactionValue: number;
    };
    grossProfit: {
      score: number;
      status: HealthStatus;
      totalRevenue: number;
      totalHpp: number;
      grossProfit: number;
      grossMargin: number;
    };
    netProfit: {
      score: number;
      status: HealthStatus;
      grossProfit: number;
      totalExpenses: number;
      netProfit: number;
      netMargin: number;
    };
    expenseControl: {
      score: number;
      status: HealthStatus;
      totalExpenses: number;
      expenseRatio: number;
      topExpenses: { description: string; amount: number }[];
    };
    productPerformance: {
      score: number;
      status: HealthStatus;
      totalProducts: number;
      activeProducts: number;
      topProduct: { name: string; revenue: number; margin: number } | null;
      lowMarginCount: number;
    };
  };
  insights: { type: "positive" | "warning" | "danger"; message: string }[];
}

export class ToolsService {
  /**
   * Mengambil data profit per produk
   */
  public async getProfitPerProduct(
    outletId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ProfitPerProductResult> {
    const [items, totalOrders] = await Promise.all([
      OutletRepository.getCompletedOrderItems(outletId, startDate, endDate),
      OutletRepository.getTotalOrders(outletId, startDate, endDate),
    ]);

    const grouped = this.groupOrderItemsByProduct(items);

    let summaryRevenue = 0;
    let summaryHpp = 0;
    let summaryQty = 0;

    const products: Omit<ProductProfitItem, "contribution">[] = [];

    for (const [productId, productItems] of grouped.entries()) {
      const first = productItems[0];
      const totalQty = productItems.reduce((s, i) => s + i.quantity, 0);
      const totalRevenue = productItems.reduce(
        (s, i) => s + i.priceAtTimeOfOrder * i.quantity,
        0,
      );
      const totalHppCost = productItems.reduce(
        (s, i) => s + i.hppAtTimeOfOrder * i.quantity,
        0,
      );
      const totalProfit = totalRevenue - totalHppCost;
      const marginPercentage =
        totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      const avgSellingPrice = totalQty > 0 ? totalRevenue / totalQty : 0;

      summaryRevenue += totalRevenue;
      summaryHpp += totalHppCost;
      summaryQty += totalQty;

      products.push({
        productId,
        productName: first.productName,
        image: first.productImage,
        unit: first.unit,
        totalQtySold: totalQty,
        totalRevenue,
        totalHppCost,
        totalProfit,
        marginPercentage,
        avgSellingPrice,
        avgHpp: first.averageHpp,
      });
    }

    const summaryProfit = summaryRevenue - summaryHpp;
    const avgMarginPercentage =
      summaryRevenue > 0 ? (summaryProfit / summaryRevenue) * 100 : 0;

    const productsWithContribution: ProductProfitItem[] = products
      .map((p) => ({
        ...p,
        contribution:
          summaryProfit > 0 ? (p.totalProfit / summaryProfit) * 100 : 0,
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit);

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalRevenue: summaryRevenue,
        totalHppCost: summaryHpp,
        totalProfit: summaryProfit,
        avgMarginPercentage,
        totalQtySold: summaryQty,
        totalOrders,
      },
      products: productsWithContribution,
    };
  }

  /**
   * Mengambil analisis kesehatan bisnis
   */
  public async getBusinessHealth(
    outletId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BusinessHealthResult> {
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const [
      currentItems,
      prevItems,
      currentOrders,
      prevOrders,
      expenses,
      allProducts,
      soldProductIds,
    ] = await Promise.all([
      OutletRepository.getCompletedOrderItems(outletId, startDate, endDate),
      OutletRepository.getCompletedOrderItems(outletId, prevStart, prevEnd),
      OutletRepository.getTotalOrders(outletId, startDate, endDate),
      OutletRepository.getTotalOrders(outletId, prevStart, prevEnd),
      OutletRepository.getExpenses(outletId, startDate, endDate),
      OutletRepository.getGoodsProducts(outletId),
      OutletRepository.getSoldProductIds(outletId, startDate, endDate),
    ]);

    // Revenue logic
    const currentRevenue = currentItems.reduce(
      (s, i) => s + i.priceAtTimeOfOrder * i.quantity,
      0,
    );
    const prevRevenue = prevItems.reduce(
      (s, i) => s + i.priceAtTimeOfOrder * i.quantity,
      0,
    );
    const growthRate =
      prevRevenue > 0
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
        : 0;
    const avgTransactionValue =
      currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const revenueScore = this.clamp(this.scoreRevenueGrowth(growthRate));

    // Gross profit logic
    const totalHpp = currentItems.reduce(
      (s, i) => s + i.hppAtTimeOfOrder * i.quantity,
      0,
    );
    const grossProfit = currentRevenue - totalHpp;
    const grossMargin =
      currentRevenue > 0 ? (grossProfit / currentRevenue) * 100 : 0;
    const grossProfitScore = this.clamp(this.scoreGrossMargin(grossMargin));

    // Net profit logic
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    const netMargin =
      currentRevenue > 0 ? (netProfit / currentRevenue) * 100 : 0;
    const netProfitScore = this.clamp(this.scoreNetMargin(netMargin));

    // Expense logic
    const expenseRatio =
      currentRevenue > 0 ? (totalExpenses / currentRevenue) * 100 : 0;
    const expenseScore = this.clamp(this.scoreExpenseRatio(expenseRatio));
    const topExpenses = expenses.slice(0, 3).map((e) => ({
      description: e.description,
      amount: e.amount,
    }));

    // Product performance logic
    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter((p) =>
      soldProductIds.has(p.productId),
    ).length;
    const activeRatio =
      totalProducts > 0 ? (activeProducts / totalProducts) * 100 : 0;
    const productScore = this.clamp(this.scoreActiveProductRatio(activeRatio));

    const { topProduct, lowMarginCount } = this.analyzeProducts(currentItems);

    const overallScore = Math.round(
      revenueScore * 0.25 +
        grossProfitScore * 0.25 +
        netProfitScore * 0.25 +
        expenseScore * 0.15 +
        productScore * 0.1,
    );

    const metrics: BusinessHealthResult["metrics"] = {
      revenue: {
        score: revenueScore,
        status: this.toStatus(revenueScore),
        current: currentRevenue,
        previous: prevRevenue,
        growthRate,
        totalOrders: currentOrders,
        avgTransactionValue,
      },
      grossProfit: {
        score: grossProfitScore,
        status: this.toStatus(grossProfitScore),
        totalRevenue: currentRevenue,
        totalHpp,
        grossProfit,
        grossMargin,
      },
      netProfit: {
        score: netProfitScore,
        status: this.toStatus(netProfitScore),
        grossProfit,
        totalExpenses,
        netProfit,
        netMargin,
      },
      expenseControl: {
        score: expenseScore,
        status: this.toStatus(expenseScore),
        totalExpenses,
        expenseRatio,
        topExpenses,
      },
      productPerformance: {
        score: productScore,
        status: this.toStatus(productScore),
        totalProducts,
        activeProducts,
        topProduct,
        lowMarginCount,
      },
    };

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      overallScore,
      grade: this.toGrade(overallScore),
      metrics,
      insights: this.buildInsights(metrics),
    };
  }

  // --- Private Helper Methods ---

  private groupOrderItemsByProduct(
    items: RawOrderItem[],
  ): Map<string, RawOrderItem[]> {
    return items.reduce((map, item) => {
      const existing = map.get(item.productId) ?? [];
      map.set(item.productId, [...existing, item]);
      return map;
    }, new Map<string, RawOrderItem[]>());
  }

  private analyzeProducts(items: RawOrderItem[]) {
    const productRevMap = new Map<
      string,
      { name: string; revenue: number; hpp: number }
    >();
    for (const item of items) {
      const existing = productRevMap.get(item.productId);
      const revenue = item.priceAtTimeOfOrder * item.quantity;
      const hpp = item.hppAtTimeOfOrder * item.quantity;
      if (existing) {
        existing.revenue += revenue;
        existing.hpp += hpp;
      } else {
        productRevMap.set(item.productId, {
          name: item.productName,
          revenue,
          hpp,
        });
      }
    }

    let topProduct: BusinessHealthResult["metrics"]["productPerformance"]["topProduct"] =
      null;
    let lowMarginCount = 0;

    for (const [, p] of productRevMap.entries()) {
      const margin =
        p.revenue > 0 ? ((p.revenue - p.hpp) / p.revenue) * 100 : 0;
      if (margin < 20) lowMarginCount++;
      if (!topProduct || p.revenue > topProduct.revenue) {
        topProduct = { name: p.name, revenue: p.revenue, margin };
      }
    }

    return { topProduct, lowMarginCount };
  }

  private buildInsights(
    data: BusinessHealthResult["metrics"],
  ): BusinessHealthResult["insights"] {
    const insights: BusinessHealthResult["insights"] = [];

    if (data.revenue.growthRate > 10) {
      insights.push({
        type: "positive",
        message: `Revenue tumbuh ${data.revenue.growthRate.toFixed(1)}% dibanding periode sebelumnya. Pertahankan momentum ini.`,
      });
    } else if (data.revenue.growthRate < 0) {
      insights.push({
        type: "danger",
        message: `Revenue turun ${Math.abs(data.revenue.growthRate).toFixed(1)}% dibanding periode sebelumnya. Evaluasi strategi penjualan.`,
      });
    }

    if (data.grossProfit.grossMargin >= 40) {
      insights.push({
        type: "positive",
        message: `Gross margin ${data.grossProfit.grossMargin.toFixed(1)}% sangat sehat. HPP terkendali dengan baik.`,
      });
    } else if (data.grossProfit.grossMargin < 20) {
      insights.push({
        type: "danger",
        message: `Gross margin hanya ${data.grossProfit.grossMargin.toFixed(1)}%. Tinjau ulang HPP atau harga jual produk.`,
      });
    }

    if (data.netProfit.netMargin < 10) {
      insights.push({
        type: "warning",
        message: `Net margin ${data.netProfit.netMargin.toFixed(1)}% masih di bawah ideal. Tekan operasional untuk meningkatkan profit bersih.`,
      });
    } else if (data.netProfit.netMargin >= 20) {
      insights.push({
        type: "positive",
        message: `Net margin ${data.netProfit.netMargin.toFixed(1)}% sangat baik. Bisnis efisien.`,
      });
    }

    if (data.expenseControl.expenseRatio > 40) {
      insights.push({
        type: "warning",
        message: `Rasio pengeluaran mencapai ${data.expenseControl.expenseRatio.toFixed(1)}% dari omzet.`,
      });
    }

    if (data.productPerformance.lowMarginCount > 0) {
      insights.push({
        type: "danger",
        message: `${data.productPerformance.lowMarginCount} produk memiliki margin < 20%.`,
      });
    }

    return insights.slice(0, 5);
  }

  // --- Scoring Helpers ---

  private toStatus(score: number): HealthStatus {
    if (score >= 70) return "healthy";
    if (score >= 45) return "warning";
    return "danger";
  }

  private toGrade(score: number): Grade {
    if (score >= 80) return "A";
    if (score >= 60) return "B";
    if (score >= 40) return "C";
    return "D";
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value));
  }

  private scoreRevenueGrowth(growthRate: number): number {
    if (growthRate > 10) return 80 + (growthRate - 10) * 2;
    if (growthRate >= 0) return 60 + growthRate * 2;
    return 60 + growthRate * 3;
  }

  private scoreGrossMargin(margin: number): number {
    if (margin > 40) return 80 + (margin - 40) * 0.5;
    if (margin >= 20) return 50 + (margin - 20) * 1.5;
    return margin * 2.5;
  }

  private scoreNetMargin(margin: number): number {
    if (margin > 20) return 80 + (margin - 20) * 1;
    if (margin >= 10) return 50 + (margin - 10) * 3;
    return margin * 5;
  }

  private scoreExpenseRatio(ratio: number): number {
    if (ratio < 20) return 100 - ratio;
    if (ratio <= 40) return 80 - (ratio - 20) * 1.5;
    return 50 - (ratio - 40) * 1.25;
  }

  private scoreActiveProductRatio(ratio: number): number {
    if (ratio > 70) return 80 + (ratio - 70) * 0.67;
    if (ratio >= 40) return 50 + (ratio - 40) * 1;
    return ratio * 1.25;
  }
}

// Export instance tunggal jika ingin digunakan sebagai singleton
export const toolsService = new ToolsService();
