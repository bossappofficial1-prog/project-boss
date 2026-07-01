"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  FileSpreadsheet,
  Loader2,
  Receipt,
  Users,
  Wallet,
  Download,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useReportStaff } from "@/hooks/use-report";
import { useOutletStore } from "@/stores/outlet.store";
import { ReportStaffTable } from "./report-staff-table";
import { SummaryCard } from "../summary-card";
import { SelectOption } from "@/components/shared/select-option";
import reportApi from "@/lib/apis/report";
import { PeriodPicker, type PeriodValue } from "@/components/ui/periode-picker";

type FilterType = "daily" | "weekly" | "monthly";

export default function ReportStaffContent() {
  const { outlets, selectedOutlet } = useOutletStore();

  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [periodValue, setPeriodValue] = useState<PeriodValue>(() => {
    const now = new Date();
    return { type: "daily", date: now.toISOString().split("T")[0] };
  });
  const [outletFilter, setOutletFilter] = useState<string>(selectedOutlet?.id || "all");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (selectedOutlet?.id) setOutletFilter(selectedOutlet.id);
  }, [selectedOutlet?.id]);

  const { data, isLoading } = useReportStaff(
    outletFilter,
    periodValue,
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

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await reportApi.exportStaffExcel(outletFilter, periodValue);
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
  }, [outletFilter, periodValue]);

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

        <PeriodPicker
          granularity={filterType}
          value={periodValue}
          onValueChange={setPeriodValue}
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
