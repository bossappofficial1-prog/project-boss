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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Type badge colors
const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  IN: {
    label: "Masuk",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: <ArrowDownCircle className="h-3 w-3" />,
  },
  OUT: {
    label: "Keluar",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: <ArrowUpCircle className="h-3 w-3" />,
  },
  ADJUSTMENT: {
    label: "Penyesuaian",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: <Settings className="h-3 w-3" />,
  },
  RETURN: {
    label: "Retur",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    icon: <RotateCcw className="h-3 w-3" />,
  },
};

// Reference type labels
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
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Stok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Stok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Belum ada riwayat pergerakan stok</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Stok
            <Badge variant="secondary" className="ml-2">
              {logs.length} catatan
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="w-[160px]">Tanggal</TableHead>
                  <TableHead className="w-[100px]">Tipe</TableHead>
                  <TableHead className="w-[80px] text-right">Qty</TableHead>
                  <TableHead className="w-[120px] text-right">HPP/Unit</TableHead>
                  <TableHead className="w-[100px]">Ref. Type</TableHead>
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
                    <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="font-medium text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-blue-600"}`}>
                        {isPositive ? "+" : isNegative ? "-" : ""}
                        {Math.abs(log.quantity)} {unit}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {log.hppPerUnit ? formatCurrency(log.hppPerUnit) : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.referenceType ? (
                          <span className="text-gray-600 dark:text-gray-400">
                            {refTypeLabels[log.referenceType] || log.referenceType}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell
                        className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate"
                        title={log.notes || ""}>
                        {log.notes || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.faktur ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setPreviewImage(log.faktur)}>
                            <ImageIcon className="h-4 w-4 text-blue-600" />
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">
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
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh]">
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
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
