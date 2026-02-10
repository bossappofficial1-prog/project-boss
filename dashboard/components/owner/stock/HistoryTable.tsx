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

interface HistoryTableProps {
  logs: StockLogItem[];
  isLoading: boolean;
  formatCurrency: (amount: number | null) => string;
  formatDate: (dateStr: string) => string;
  unit?: string;
}

const typeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "outline"; icon: React.ReactNode }> = {
  IN: {
    label: "Masuk",
    variant: "success",
    icon: <ArrowDownCircle className="h-3 w-3" />,
  },
  OUT: {
    label: "Keluar",
    variant: "destructive",
    icon: <ArrowUpCircle className="h-3 w-3" />,
  },
  ADJUSTMENT: {
    label: "Penyesuaian",
    variant: "secondary",
    icon: <Settings className="h-3 w-3" />,
  },
  RETURN: {
    label: "Retur",
    variant: "warning",
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Riwayat Stok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Riwayat Stok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <RefreshCw className="mx-auto mb-3 h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Belum ada riwayat pergerakan stok</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Riwayat Stok
              </CardTitle>
              <CardDescription>{logs.length} catatan pergerakan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Tanggal</TableHead>
                  <TableHead className="w-[100px]">Tipe</TableHead>
                  <TableHead className="w-[80px] text-right">Qty</TableHead>
                  <TableHead className="w-[120px] text-right">HPP/Unit</TableHead>
                  <TableHead className="w-[100px]">Referensi</TableHead>
                  <TableHead className="min-w-[150px]">Catatan</TableHead>
                  <TableHead className="w-[80px] text-center">Faktur</TableHead>
                  <TableHead className="w-[100px] text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const config = typeConfig[log.type] || typeConfig.IN;
                  const isPositive = log.type === "IN";
                  const isNegative = log.type === "OUT" || log.type === "RETURN";

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm tabular-nums">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1 text-xs">
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isNegative
                              ? "text-destructive"
                              : "text-primary"
                          }`}>
                        {isPositive ? "+" : isNegative ? "-" : ""}
                        {Math.abs(log.quantity)} {unit}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {log.hppPerUnit ? formatCurrency(log.hppPerUnit) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.referenceType
                          ? refTypeLabels[log.referenceType] || log.referenceType
                          : "-"}
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate text-sm text-muted-foreground"
                        title={log.notes || ""}>
                        {log.notes || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.faktur ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setPreviewImage(log.faktur)}>
                            <ImageIcon className="h-4 w-4 text-primary" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {log.runningBalance ?? "-"} {unit}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-[90vh] max-w-3xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-10 right-0 text-white hover:bg-white/20"
              onClick={() => setPreviewImage(null)}>
              <X className="h-6 w-6" />
            </Button>
            <img
              src={previewImage}
              alt="Faktur"
              className="max-h-[80vh] max-w-full rounded-md object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
