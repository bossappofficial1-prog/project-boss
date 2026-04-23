"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Settings,
  RotateCcw,
  History,
  ImageIcon,
  X,
} from "lucide-react";
import type { StockLogItem } from "@/hooks/useStockHistory";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HistoryTableProps {
  logs: StockLogItem[];
  isLoading: boolean;
  formatCurrency: (amount: number | null) => string;
  formatDate: (dateStr: string) => string;
  unit?: string;
}

const typeConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  IN: {
    label: "Masuk",
    className: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    icon: <ArrowDownCircle className="h-3 w-3" />,
  },
  OUT: {
    label: "Keluar",
    className: "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400",
    icon: <ArrowUpCircle className="h-3 w-3" />,
  },
  ADJUSTMENT: {
    label: "Penyesuaian",
    className: "border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400",
    icon: <Settings className="h-3 w-3" />,
  },
  RETURN: {
    label: "Retur",
    className: "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    icon: <RotateCcw className="h-3 w-3" />,
  },
};

const refTypeLabels: Record<string, string> = {
  ORDER: "Pesanan",
  PURCHASE: "Pembelian",
  MANUAL: "Manual",
  ADJUSTMENT: "Penyesuaian",
  RETURN: "Pengembalian",
};

export default function HistoryTable({
  logs,
  isLoading,
  formatCurrency,
  formatDate,
  unit = "pcs",
}: HistoryTableProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="rounded-md gap-0 py-0 border border-border/80 bg-background shadow-sm overflow-hidden animate-pulse">
        <CardHeader className="p-4 border-b border-border/40 bg-muted/30">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 bg-muted/30" />
            <Skeleton className="h-3 w-48 bg-muted/20" />
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-muted/10 rounded-md" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="rounded-md border border-border/80 bg-background shadow-sm border-dashed">
        <CardContent className="py-20 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <RefreshCw className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-widest">Belum Ada Riwayat</p>
          <p className="text-xs text-muted-foreground mt-1">Tidak ada pergerakan stok untuk produk ini</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-md gap-0 py-0 border border-border/80 bg-background shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-border/40 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-foreground/90 flex items-center gap-2">
                <History className="h-4 w-4" />
                Riwayat Stok
              </CardTitle>
              <CardDescription className="text-[10px] font-medium uppercase tracking-tighter opacity-70">
                {logs.length} catatan pergerakan inventaris
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[160px] h-10 text-[10px] font-bold uppercase tracking-widest">Tanggal</TableHead>
                  <TableHead className="w-[100px] h-10 text-[10px] font-bold uppercase tracking-widest">Tipe</TableHead>
                  <TableHead className="w-[80px] h-10 text-[10px] font-bold uppercase tracking-widest text-right">Qty</TableHead>
                  <TableHead className="w-[120px] h-10 text-[10px] font-bold uppercase tracking-widest text-right">HPP/Unit</TableHead>
                  <TableHead className="w-[100px] h-10 text-[10px] font-bold uppercase tracking-widest">Referensi</TableHead>
                  <TableHead className="min-w-[150px] h-10 text-[10px] font-bold uppercase tracking-widest">Catatan</TableHead>
                  <TableHead className="w-[80px] h-10 text-[10px] font-bold uppercase tracking-widest text-center">Faktur</TableHead>
                  <TableHead className="w-[100px] h-10 text-[10px] font-bold uppercase tracking-widest text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const config = typeConfig[log.type] || typeConfig.IN;
                  const isPositive = log.type === "IN";
                  const isNegative = log.type === "OUT" || log.type === "RETURN";

                  return (
                    <TableRow key={log.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs font-medium tabular-nums text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1 py-0 px-2 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-none", config.className)}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold tabular-nums text-sm",
                          isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-foreground/90"
                        )}>
                        {isPositive ? "+" : isNegative ? "-" : ""}
                        {Math.abs(log.quantity)} <span className="text-[10px] font-medium opacity-60 ml-0.5">{unit}</span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold tabular-nums text-foreground/80">
                        {log.hppPerUnit ? formatCurrency(log.hppPerUnit) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase px-1.5 py-0 border-border/60 bg-muted/20 text-muted-foreground/80">
                          {log.referenceType ? refTypeLabels[log.referenceType] || log.referenceType : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate text-xs text-muted-foreground italic opacity-80"
                        title={log.notes || ""}>
                        {log.notes || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.faktur ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary transition-all"
                            onClick={() => setPreviewImage(log.faktur)}>
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground opacity-30 italic text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-xs text-foreground/90">
                        {log.runningBalance ?? "-"} <span className="text-[10px] font-medium opacity-60">{unit}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-[90vh] max-w-4xl animate-in zoom-in-95 duration-300">
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md"
              onClick={() => setPreviewImage(null)}>
              <X className="h-5 w-5" />
            </Button>
            <div className="overflow-hidden rounded-md border border-white/20 shadow-2xl">
              <img
                src={previewImage}
                alt="Faktur"
                className="max-h-[80vh] max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
