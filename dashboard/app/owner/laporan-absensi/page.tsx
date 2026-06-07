"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Loader2, RefreshCcw, MapPin, ExternalLink, Download, FileSpreadsheet } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { useOutletContext } from "@/components/providers/OutletProvider";
import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { AttendanceMapViewer } from "@/components/owner/attendance/AttendanceMapViewer";
import { attendanceApi } from "@/lib/apis/attendance";

export default function LaporanAbsensiPage() {
  const { selectedOutletId: outletId } = useOutletContext();

  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [mapTarget, setMapTarget] = React.useState<{
    clockIn: { lat: number; lng: number } | null;
    clockOut: { lat: number; lng: number } | null;
    staffName: string;
  } | null>(null);

  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async (exportFormat: "csv" | "excel") => {
    if (!outletId) return;
    setIsExporting(true);
    try {
      const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
      const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
      
      const blob = await attendanceApi.exportAttendance({
        outletId,
        startDate,
        endDate,
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = exportFormat === "excel" ? "xlsx" : "csv";
      link.download = `laporan-absensi-${outletId}-${startDate}-${endDate}.${extension}`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Laporan absensi berhasil diekspor (${extension.toUpperCase()})`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengekspor laporan");
    } finally {
      setIsExporting(false);
    }
  };

  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["owner-attendance", outletId, startDate, endDate],
    queryFn: async () => {
      if (!outletId) return { data: [], total: 0 };
      return attendanceApi.listForOwner({
        outletId,
        startDate,
        endDate,
        limit: 200,
      });
    },
    enabled: !!outletId,
    staleTime: 30_000,
  });

  const records = data?.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Laporan Absensi"
        description="Riwayat absen masuk/pulang staff per outlet."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            {outletId && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5"
                  onClick={() => window.open(`/attendance/portal?outletId=${outletId}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Buka Portal Absensi</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-9 gap-1.5"
                  onClick={() => handleExport("csv")}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4" />
                  <span>{isExporting ? "Mengekspor..." : "Export CSV"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-9 gap-1.5"
                  onClick={() => handleExport("excel")}
                  disabled={isExporting}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export Excel</span>
                </Button>
              </>
            )}
          </div>
        }
      />

      <DataTable
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        onRefresh={refetch}
        data={records}
        emptyMessage="Belum ada absensi pada rentang tanggal ini."
        columns={[
          {
            accessorKey: "date",
            header: "Tanggal",
            cell: ({ row }) => (
              <span className="text-xs font-bold tabular-nums">
                {format(new Date(row.original.date), "dd MMM yyyy", { locale: localeId })}
              </span>
            ),
          },
          {
            accessorKey: "staff",
            header: "Staff",
            cell: ({ row }) => (
              <span className="text-xs font-medium">
                {row.original.staff?.name ?? "-"}
              </span>
            ),
          },
          {
            accessorKey: "clockIn",
            header: "Jam Masuk",
            cell: ({ row }) => (
              <span className="text-xs tabular-nums">
                {format(new Date(row.original.clockIn), "HH:mm", { locale: localeId })}
              </span>
            ),
          },
          {
            accessorKey: "clockOut",
            header: "Jam Pulang",
            cell: ({ row }) =>
              row.original.clockOut ? (
                <span className="text-xs tabular-nums">
                  {format(new Date(row.original.clockOut), "HH:mm", { locale: localeId })}
                </span>
              ) : (
                <Badge variant="outline" className="text-[9px] font-bold text-amber-600 border-amber-200">
                  Belum
                </Badge>
              ),
          },
          {
            accessorKey: "duration",
            header: "Durasi",
            cell: ({ row }) => {
              if (!row.original.clockOut) return <span className="text-xs text-muted-foreground">–</span>;
              const diff = new Date(row.original.clockOut).getTime() - new Date(row.original.clockIn).getTime();
              const hours = Math.floor(diff / 3600000);
              const minutes = Math.floor((diff % 3600000) / 60000);
              return (
                <span className="text-xs font-bold tabular-nums">
                  {hours}h {minutes}m
                </span>
              );
            },
          },
          {
            accessorKey: "clockInLat",
            header: "GPS",
            cell: ({ row }) => {
              const hasIn = row.original.clockInLat != null;
              const hasOut = row.original.clockOutLat != null;
              if (!hasIn && !hasOut) return <span className="text-xs text-muted-foreground">–</span>;
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-1.5 py-1 text-[10px] font-mono gap-1.5"
                  onClick={() =>
                    setMapTarget({
                      clockIn: hasIn
                        ? { lat: row.original.clockInLat!, lng: row.original.clockInLng! }
                        : null,
                      clockOut: hasOut
                        ? { lat: row.original.clockOutLat!, lng: row.original.clockOutLng! }
                        : null,
                      staffName: row.original.staff?.name ?? "-",
                    })
                  }
                >
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>
                    {hasIn ? row.original.clockInLat!.toFixed(4) : "-"},
                    {hasOut ? row.original.clockOutLat!.toFixed(4) : "-"}
                  </span>
                </Button>
              );
            },
          },
        ]}
      />

      <AttendanceMapViewer
        open={!!mapTarget}
        onOpenChange={(o) => !o && setMapTarget(null)}
        clockIn={mapTarget?.clockIn ?? null}
        clockOut={mapTarget?.clockOut ?? null}
        staffName={mapTarget?.staffName}
      />
    </div>
  );
}
