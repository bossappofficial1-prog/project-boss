import { id } from "date-fns/locale";
import {
  RawPLExpense,
  RawPLOrderItem,
  ToolsRepository,
} from "..//repositories/tools.repository";
import {
  OutletRepository,
  RawOrderItem,
} from "../repositories/outlet.repository";
import { format } from "date-fns";

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

export interface HourSlot {
  hour: number;
  orderCount: number;
  revenue: number;
}

export interface DayData {
  day: number; // 0 = Senin (ISO: 1), 6 = Minggu (ISO: 0)
  dayName: string;
  totalOrders: number;
  totalRevenue: number;
  slots: HourSlot[];
}

export interface JamRamaResult {
  period: { startDate: string; endDate: string };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrdersPerDay: number;
    avgRevenuePerDay: number;
    peakHour: number;
    peakDay: string;
    peakDayOrders: number;
    peakHourOrders: number;
  };
  days: DayData[];
}

export interface ExpenseEntry {
  description: string;
  amount: number;
  date: string;
}

export interface MonthlySnapshot {
  month: string;
  monthName: string;
  revenue: number;
  hpp: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface PLResult {
  period: { startDate: string; endDate: string; label: string };
  current: {
    revenue: number;
    hpp: number;
    grossProfit: number;
    grossMargin: number;
    expenses: number;
    expenseBreakdown: ExpenseEntry[];
    netProfit: number;
    netMargin: number;
    totalOrders: number;
    totalQtySold: number;
  };
  previous: {
    revenue: number;
    grossProfit: number;
    netProfit: number;
  };
  monthly: MonthlySnapshot[];
}

const DAY_NAMES = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];
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
      overallScore: overallScore,
      grade: this.toGrade(overallScore),
      metrics,
      insights: this.buildInsights(metrics),
    };
  }

  public async getIncomeStatement(
    outletId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const [
      currentItems,
      prevItems,
      totalOrders,
      currentExpenses,
      prevExpenses,
    ] = await Promise.all([
      ToolsRepository.getOrderItems(outletId, startDate, endDate),
      ToolsRepository.getOrderItems(outletId, prevStart, prevEnd),
      ToolsRepository.getTotalOrders(outletId, startDate, endDate),
      ToolsRepository.getExpenses(outletId, startDate, endDate),
      ToolsRepository.getExpenses(outletId, prevStart, prevEnd),
    ]);

    // Current period
    const revenue = this.calcRevenue(currentItems);
    const hpp = this.calcHpp(currentItems);
    const grossProfit = revenue - hpp;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const totalExpenses = this.calcTotalExpenses(currentExpenses);
    const netProfit = grossProfit - totalExpenses;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const totalQtySold = currentItems.reduce((s, i) => s + i.quantity, 0);

    // Previous period
    const prevRevenue = this.calcRevenue(prevItems);
    const prevHpp = this.calcHpp(prevItems);
    const prevGrossProfit = prevRevenue - prevHpp;
    const prevTotalExpenses = this.calcTotalExpenses(prevExpenses);
    const prevNetProfit = prevGrossProfit - prevTotalExpenses;

    // Monthly breakdown
    const itemsByMonth = this.groupItemsByMonth(currentItems);
    const expensesByMonth = this.groupExpensesByMonth(currentExpenses);

    const allMonths = new Set([
      ...itemsByMonth.keys(),
      ...expensesByMonth.keys(),
    ]);

    const monthly: MonthlySnapshot[] = [...allMonths].sort().map((month) => {
      const monthItems = itemsByMonth.get(month) ?? [];
      const monthExpenses = expensesByMonth.get(month) ?? [];
      const mRevenue = this.calcRevenue(monthItems);
      const mHpp = this.calcHpp(monthItems);
      const mGrossProfit = mRevenue - mHpp;
      const mExpenses = this.calcTotalExpenses(monthExpenses);
      const mNetProfit = mGrossProfit - mExpenses;

      return {
        month,
        monthName: format(new Date(month + "-01"), "MMM", { locale: id }),
        revenue: mRevenue,
        hpp: mHpp,
        grossProfit: mGrossProfit,
        expenses: mExpenses,
        netProfit: mNetProfit,
      };
    });

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        label: this.getPeriodLabel(startDate, endDate),
      },
      current: {
        revenue,
        hpp,
        grossProfit,
        grossMargin,
        expenses: totalExpenses,
        expenseBreakdown: currentExpenses.map((e) => ({
          description: e.description,
          amount: e.amount,
          date: e.date.toISOString(),
        })),
        netProfit,
        netMargin,
        totalOrders,
        totalQtySold,
      },
      previous: {
        revenue: prevRevenue,
        grossProfit: prevGrossProfit,
        netProfit: prevNetProfit,
      },
      monthly,
    };
  }

  public async getPeakHours(outletId: string, startDate: Date, endDate: Date) {
    const orders = await ToolsRepository.getPeakHours(
      outletId,
      startDate,
      endDate,
    );

    const days = this.buildEmptyDays();

    for (const order of orders) {
      const dayIndex = this.toDayIndex(order.createdAt.getDay());
      const hour = order.createdAt.getHours();

      days[dayIndex].totalOrders++;
      days[dayIndex].totalRevenue += order.totalAmount;
      days[dayIndex].slots[hour].orderCount++;
      days[dayIndex].slots[hour].revenue += order.totalAmount;
    }

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);

    // Unique operational days in range
    const uniqueDays = new Set(orders.map((o) => o.createdAt.toDateString()))
      .size;
    const safeDays = uniqueDays > 0 ? uniqueDays : 1;

    // Peak day
    const peakDay = [...days].sort((a, b) => b.totalOrders - a.totalOrders)[0];

    // Peak hour (aggregate across all days)
    const hourTotals = this.buildEmptySlots();
    for (const day of days) {
      for (const slot of day.slots) {
        hourTotals[slot.hour].orderCount += slot.orderCount;
        hourTotals[slot.hour].revenue += slot.revenue;
      }
    }
    const peakHourSlot = [...hourTotals].sort(
      (a, b) => b.orderCount - a.orderCount,
    )[0];

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalOrders,
        totalRevenue,
        avgOrdersPerDay: Math.round(totalOrders / safeDays),
        avgRevenuePerDay: Math.round(totalRevenue / safeDays),
        peakHour: peakHourSlot?.hour ?? 0,
        peakDay: peakDay?.dayName ?? "-",
        peakDayOrders: peakDay?.totalOrders ?? 0,
        peakHourOrders: peakHourSlot?.orderCount ?? 0,
      },
      days,
    };
  }

  // --- Private Helper Methods ---

  private toDayIndex(jsDay: number): number {
    return jsDay === 0 ? 6 : jsDay - 1;
  }

  private buildEmptySlots(): HourSlot[] {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orderCount: 0,
      revenue: 0,
    }));
  }

  private buildEmptyDays(): DayData[] {
    return DAY_NAMES.map((dayName, day) => ({
      day,
      dayName,
      totalOrders: 0,
      totalRevenue: 0,
      slots: this.buildEmptySlots(),
    }));
  }

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

  private calcRevenue(items: RawPLOrderItem[]): number {
    return items.reduce((s, i) => s + i.priceAtTimeOfOrder * i.quantity, 0);
  }

  private calcHpp(items: RawPLOrderItem[]): number {
    return items.reduce((s, i) => s + i.hppAtTimeOfOrder * i.quantity, 0);
  }

  private calcTotalExpenses(expenses: RawPLExpense[]): number {
    return expenses.reduce((s, e) => s + e.amount, 0);
  }

  private getPeriodLabel(startDate: Date, endDate: Date): string {
    const sameMonth =
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear();

    if (sameMonth) {
      return format(startDate, "MMMM yyyy", { locale: id });
    }

    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    if (sameYear) {
      return `${format(startDate, "MMM", { locale: id })} – ${format(endDate, "MMM yyyy", { locale: id })}`;
    }

    return `${format(startDate, "MMM yyyy", { locale: id })} – ${format(endDate, "MMM yyyy", { locale: id })}`;
  }

  private groupItemsByMonth(
    items: RawPLOrderItem[],
  ): Map<string, RawPLOrderItem[]> {
    return items.reduce((map, item) => {
      const key = format(item.createdAt, "yyyy-MM");
      map.set(key, [...(map.get(key) ?? []), item]);
      return map;
    }, new Map<string, RawPLOrderItem[]>());
  }

  private groupExpensesByMonth(
    expenses: RawPLExpense[],
  ): Map<string, RawPLExpense[]> {
    return expenses.reduce((map, expense) => {
      const key = format(expense.date, "yyyy-MM");
      map.set(key, [...(map.get(key) ?? []), expense]);
      return map;
    }, new Map<string, RawPLExpense[]>());
  }
}

// Export instance tunggal jika ingin digunakan sebagai singleton
export const toolsService = new ToolsService();
