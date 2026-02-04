"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { useReportStaff, StaffReportItem } from "@/hooks/useReport";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { ReportStaffTable } from "./ReportStaffTable";
import { SummaryCard } from "../SummaryCard";

type FilterType = "daily" | "weekly" | "monthly";

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export default function ReportStaffContent() {
  const { outlets, selectedOutlet } = useOutletContext();

  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [outletFilter, setOutletFilter] = useState<string>(selectedOutlet?.id || "all");

  React.useEffect(() => {
    if (selectedOutlet?.id) {
      setOutletFilter(selectedOutlet.id);
    }
  }, [selectedOutlet?.id]);

  const { data, isLoading } = useReportStaff(
    outletFilter,
    filterType,
    format(currentDate, "yyyy-MM-dd"),
  );

  const totals = useMemo(() => {
    return (data || []).reduce(
      (acc, curr) => ({
        transactions: acc.transactions + curr.transactionCount,
        revenue: acc.revenue + (curr.type === "CASHIER" ? curr.revenue : 0),
        commission: acc.commission + (curr.type === "SERVICE" ? curr.commission : 0),
      }),
      { transactions: 0, revenue: 0, commission: 0 },
    );
  }, [data]);

  const adjustDate = (amount: number): void => {
    const newDate = new Date(currentDate);
    if (filterType === "daily") newDate.setDate(newDate.getDate() + amount);
    if (filterType === "weekly") newDate.setDate(newDate.getDate() + amount * 7); // Move by week
    if (filterType === "monthly") newDate.setMonth(newDate.getMonth() + amount);

    setCurrentDate(newDate);
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-emerald-500 w-7 h-7" />
            Laporan Kinerja Staff
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <select
              value={outletFilter}
              onChange={(e) => setOutletFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="all">Semua Outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Pantau kinerja kasir dan komisi staff layanan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400">
            <Download className="w-5 h-5" />
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-md flex items-center gap-2 text-sm transition-all shadow-lg shadow-emerald-900/20">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          title="Total Transaksi"
          value={totals.transactions}
          icon={<Receipt className="w-4 h-4 text-slate-500" />}
        />
        <SummaryCard
          title="Total Penjualan (Kasir)"
          value={totals.revenue}
          icon={<Wallet className="w-4 h-4 text-emerald-500" />}
        />
        <SummaryCard
          title="Total Komisi (Layanan)"
          value={totals.commission}
          icon={<Users className="w-4 h-4 text-indigo-500" />}
        />
      </div>

      {/* Table Control */}
      <div className="bg-white dark:bg-[#1e293b] p-2 rounded-lg border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-md dark:shadow-xl">
        <div className="flex bg-slate-100 dark:bg-[#0f172a] p-1 rounded-md border border-slate-200 dark:border-slate-700">
          <FilterButton active={filterType === "daily"} onClick={() => setFilterType("daily")}>
            Harian
          </FilterButton>
          <FilterButton active={filterType === "weekly"} onClick={() => setFilterType("weekly")}>
            Mingguan
          </FilterButton>
          <FilterButton active={filterType === "monthly"} onClick={() => setFilterType("monthly")}>
            Bulanan
          </FilterButton>
        </div>

        <div className="flex items-center gap-6 px-2">
          <button
            onClick={() => adjustDate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 font-bold text-slate-900 dark:text-white">
            <CalendarIcon className="w-5 h-5 text-emerald-500" />
            <span className="min-w-[180px] text-center text-lg">
              {formatPeriodLabel(filterType, currentDate)}
            </span>
          </div>
          <button
            onClick={() => adjustDate(1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1e293b] rounded-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-2"></div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-center">
              Memuat Data Staff...
            </span>
          </div>
        )}
        <ReportStaffTable data={data || []} totals={totals} />
      </div>
    </>
  );
}

const FilterButton: React.FC<FilterButtonProps> = ({ children, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-xs font-bold transition-all rounded-md ${active ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}>
      {children}
    </button>
  );
};

const formatPeriodLabel = (type: FilterType, date: Date): string => {
  if (type === "daily") {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (type === "weekly") {
    // Show start - end of week
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(start.setDate(diff));
    const sunday = new Date(start.setDate(monday.getDate() + 6));
    return `${monday.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} - ${sunday.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  if (type === "monthly") {
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }
  return "";
};
