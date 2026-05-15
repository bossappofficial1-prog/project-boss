import { DateRange } from "react-day-picker";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UseStoreState {
  heatmapFilter: "orders" | "revenue";
  dateRangeFilter: "1m" | "3m" | "9m" | "custom";
  dateRange: DateRange | undefined;

  setHeatmapFilter: (filter: "orders" | "revenue") => void;
  setDateRangeFilter: (filter: "1m" | "3m" | "9m" | "custom") => void;
  setDateRange: (range: DateRange | undefined) => void;
}

export const useStoreState = create<UseStoreState>()(
  persist(
    (set) => ({
      dateRangeFilter: "1m",
      heatmapFilter: "orders",
      dateRange: undefined,

      setDateRange: (range) => set({ dateRange: range }),
      setDateRangeFilter: (filter) => set({ dateRangeFilter: filter }),
      setHeatmapFilter: (filter) => set({ heatmapFilter: filter }),
    }),
    {
      name: "state-storage",
    },
  ),
);
