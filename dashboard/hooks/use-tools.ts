import { apiClient } from "@/lib/apis/base";
import { useQuery } from "@tanstack/react-query";

export type HealthStatus = "healthy" | "warning" | "danger";
export type Grade = "A" | "B" | "C" | "D";
export type InsightType = "positive" | "warning" | "danger";

export interface BusinessHealthData {
  period: Period;
  overallScore: number;
  grade: Grade;
  metrics: Metrics;
  insights: Insight[];
}

export interface Period {
  startDate: string;
  endDate: string;
}

export interface Metrics {
  revenue: Revenue;
  grossProfit: GrossProfit;
  netProfit: NetProfit;
  expenseControl: ExpenseControl;
  productPerformance: ProductPerformance;
}

export interface Revenue {
  score: number;
  status: HealthStatus;
  current: number;
  previous: number;
  growthRate: number;
  totalOrders: number;
  avgTransactionValue: number;
}

export interface GrossProfit {
  score: number;
  status: HealthStatus;
  totalRevenue: number;
  totalHpp: number;
  grossProfit: number;
  grossMargin: number;
}

export interface NetProfit {
  score: number;
  status: HealthStatus;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  netMargin: number;
}

export interface ExpenseControl {
  score: number;
  status: HealthStatus;
  totalExpenses: number;
  expenseRatio: number;
  topExpenses: any[];
}

export interface ProductPerformance {
  score: number;
  status: HealthStatus;
  totalProducts: number;
  activeProducts: number;
  topProduct: any;
  lowMarginCount: number;
}

export interface Insight {
  type: InsightType;
  message: string;
}

export const useTools = (
  outletId?: string,
  dateRange?: { from: Date; to: Date },
) => {
  const businessHealth = useQuery({
    queryKey: [
      "businessHealth",
      outletId,
      dateRange?.from?.toISOString(),
      dateRange?.to?.toISOString(),
    ],

    queryFn: async () => {
      if (!outletId || !dateRange?.from || !dateRange?.to) {
        throw new Error("Missing required parameters");
      }

      const start = dateRange.from.toISOString();
      const end = dateRange.to.toISOString();

      console.log("Fetching business health:", { outletId, start, end });

      const response = await apiClient.get(`/tools/business-health`, {
        params: { outletId, startDate: start, endDate: end },
      });
      return response.data.data as BusinessHealthData;
    },

    enabled: !!outletId && !!dateRange?.from && !!dateRange?.to,
  });

  return {
    businessHealth,
  };
};
