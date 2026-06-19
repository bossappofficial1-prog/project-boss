"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { gooeyToast } from "goey-toast";
import { useReportStaff } from "@/hooks/use-report";
import { useOutletStore } from "@/stores/outlet.store";
import { ReportStaffTable } from "./report-staff-table";
import { SummaryCard } from "../summary-card";
import { DateFilterControl } from "./date-filter-control";
import { SelectOption } from "@/components/shared/select-option";
import reportApi from "@/lib/apis/report";

type FilterType = "daily" | "weekly" | "monthly";

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export default function ReportStaffContent() {
  const { outlets, selectedOutlet } = useOutletStore();

  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [outletFilter, setOutletFilter] = useState<string>(selectedOutlet?.id || "all");
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await reportApi.exportStaffExcel(outletFilter, {
        type: filterType,
        date: format(currentDate, "yyyy-MM-dd"),
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_Staff_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      gooeyToast.success("Berhasil mengexport laporan staff");
    } catch {
      gooeyToast.error("Gagal mengexport laporan staff");
    } finally {
      setIsExporting(false);
    }
  }, [outletFilter, filterType, currentDate]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-primary w-7 h-7" />
            Laporan Kinerja Staff
          </h1>
          <p className="text-muted-foreground text-sm">
            Pantau kinerja kasir dan komisi staff layanan.
          </p>
          <SelectOption
            value={outletFilter}
            onValueChange={setOutletFilter}
            options={[
              { value: "all", label: "Semua Outlet" },
              ...outlets.map((outlet) => ({
                value: outlet.id,
                label: outlet.name,
              })),
            ]}
            placeholder={"Pilih outlet"}
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400">
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-md flex items-center gap-2 text-sm transition-all shadow-lg shadow-emerald-900/20">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            {isExporting ? "Mengexport..." : "Export Excel"}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SummaryCard
            title="Total Transaksi"
            isCurrency={false}
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

        <DateFilterControl
          currentLabel={formatPeriodLabel(filterType, currentDate)}
          filterType={filterType}
          onNext={() => adjustDate(1)}
          onPrev={() => adjustDate(-1)}
          setFilterType={setFilterType}
        />

        {/* Table */}
        <div>
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
