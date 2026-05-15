import { ProfitPerProductData } from "@/components/pages/profit-per-product/types";
import { apiClient } from "@/lib/apis/base";
import { useQuery } from "@tanstack/react-query";

export type HealthStatus = "healthy" | "warning" | "danger";
export type Grade = "A" | "B" | "C" | "D";
export type InsightType = "positive" | "warning" | "danger";
type ToolType =
  | "incomeStatement"
  | "peakHours"
  | "profitPerProduct"
  | "businessHealth";

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

export interface PeakHoursData {
  period: Period;
  summary: Summary;
  days: Day[];
}

export interface Period {
  startDate: string;
  endDate: string;
}

export interface Summary {
  totalOrders: number;
  totalRevenue: number;
  avgOrdersPerDay: number;
  avgRevenuePerDay: number;
  peakHour: number;
  peakDay: string;
  peakDayOrders: number;
  peakHourOrders: number;
}

export interface Day {
  day: number;
  dayName: string;
  totalOrders: number;
  totalRevenue: number;
  slots: Slot[];
}

export interface Slot {
  hour: number;
  orderCount: number;
  revenue: number;
}

// income statement types
export interface IncomeStatementData {
  period: Period;
  current: Current;
  previous: Previous;
  monthly: Monthly[];
}

export interface Period {
  startDate: string;
  endDate: string;
  label: string;
}

export interface Current {
  revenue: number;
  hpp: number;
  grossProfit: number;
  grossMargin: number;
  expenses: number;
  expenseBreakdown: ExpenseBreakdown[];
  netProfit: number;
  netMargin: number;
  totalOrders: number;
  totalQtySold: number;
}

export interface ExpenseBreakdown {
  description: string;
  amount: number;
  date: string;
}

export interface Previous {
  revenue: number;
  grossProfit: number;
  netProfit: number;
}

export interface Monthly {
  month: string;
  monthName: string;
  revenue: number;
  hpp: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export const useTools = (
  tools: ToolType,
  outletId?: string,
  dateRange?: { from: Date; to: Date },
) => {
  const incomeStatement = useQuery({
    queryKey: ["incomeStatement", outletId, dateRange?.from, dateRange?.to],

    queryFn: async () => {
      if (!outletId || !dateRange?.from || !dateRange?.to) {
        throw new Error("Missing required parameters");
      }

      const start = dateRange.from;
      const end = dateRange.to;

      console.log("Fetching income statement:", { outletId, start, end });

      const response = await apiClient.get(`/tools/income-statement`, {
        params: { outletId, startDate: start, endDate: end },
      });
      return response.data.data as IncomeStatementData;
    },

    enabled: tools.includes("incomeStatement") && !!outletId && !!dateRange?.from && !!dateRange?.to,
  });

  const peakHours = useQuery({
    queryKey: ["peakHours", outletId, dateRange?.from, dateRange?.to],

    queryFn: async () => {
      if (!outletId || !dateRange?.from || !dateRange?.to) {
        throw new Error("Missing required parameters");
      }

      const start = dateRange.from;
      const end = dateRange.to;

      console.log("Fetching peak hours:", { outletId, start, end });

      const response = await apiClient.get(`/tools/peak-hours`, {
        params: { outletId, startDate: start, endDate: end },
      });
      return response.data.data as PeakHoursData;
    },

    enabled: tools.includes("peakHours") && !!outletId && !!dateRange?.from && !!dateRange?.to,
  });

  const profitPerProduct = useQuery({
    queryKey: ["profitPerProduct", outletId, dateRange?.from, dateRange?.to],

    queryFn: async () => {
      if (!outletId || !dateRange?.from || !dateRange?.to) {
        throw new Error("Missing required parameters");
      }

      const start = dateRange.from;
      const end = dateRange.to;

      console.log("Fetching profit per product:", { outletId, start, end });

      const response = await apiClient.get(`/tools/profit-per-product`, {
        params: { outletId, startDate: start, endDate: end },
      });
      return response.data.data as ProfitPerProductData;
    },

    enabled: tools.includes("profitPerProduct") && !!outletId && !!dateRange?.from && !!dateRange?.to,
  });

  const businessHealth = useQuery({
    queryKey: ["businessHealth", outletId, dateRange?.from, dateRange?.to],

    queryFn: async () => {
      if (!outletId || !dateRange?.from || !dateRange?.to) {
        throw new Error("Missing required parameters");
      }

      const start = dateRange.from;
      const end = dateRange.to;

      console.log("Fetching business health:", { outletId, start, end });

      const response = await apiClient.get(`/tools/business-health`, {
        params: { outletId, startDate: start, endDate: end },
      });
      return response.data.data as BusinessHealthData;
    },

    enabled: tools.includes("businessHealth") && !!outletId && !!dateRange?.from && !!dateRange?.to,
  });

  return {
    businessHealth,
    incomeStatement,
    peakHours,
    profitPerProduct,
  };
};
