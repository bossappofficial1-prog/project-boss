"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Users,
  LayoutGrid,
  QrCode,
  List,
  Grid2X2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { tableApi, type OutletTable } from "@/lib/apis/table";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { TableQrDialog, BulkQrDownload } from "./TableQrDialog";

import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ViewMode = "grid" | "list";
type TableStatus = OutletTable["status"];

interface TableManagementProps {
  outletId: string;
  outletSlug?: string;
  outletName?: string;
  onAdd?: (open: boolean) => void;
  onEdit?: (table: OutletTable) => void;
  onDelete?: (table: OutletTable) => void;
}

const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; cardBorder: string; dot: string; badge: string }
> = {
  AVAILABLE: {
    label: "Tersedia",
    cardBorder: "border-t-4 border-t-emerald-500",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  OCCUPIED: {
    label: "Terisi",
    cardBorder: "border-t-4 border-t-destructive",
    dot: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
  },
  RESERVED: {
    label: "Dipesan",
    cardBorder: "border-t-4 border-t-amber-500",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  BILLED: {
    label: "Tagihan",
    cardBorder: "border-t-4 border-t-amber-500",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
};

function TableCard({
  table,
  outletSlug,
  onQr,
  onEdit,
  onDelete,
}: {
  table: OutletTable;
  outletSlug?: string;
  onQr: (table: OutletTable) => void;
  onEdit?: (table: OutletTable) => void;
  onDelete?: (table: OutletTable) => void;
}) {
  const cfg = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.AVAILABLE;

  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-border/50 shadow-none flex flex-col gap-4 p-4 group",
        cfg.cardBorder,
      )}
    >
      {/* Name & Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-muted text-muted-foreground group-hover:text-primary">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <span className="font-semibold text-foreground text-sm">
            {table.name}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-black uppercase tracking-tighter shrink-0",
            cfg.badge,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full mr-1", cfg.dot)} />
          {cfg.label}
        </Badge>
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span className="text-sm tabular-nums font-medium">
          {table.capacity} Orang
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        {outletSlug && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground flex-1"
            onClick={() => onQr(table)}
          >
            <QrCode className="h-3.5 w-3.5" />
            QR
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground flex-1"
          onClick={() => onEdit?.(table)}
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-destructive flex-1"
          onClick={() => onDelete?.(table)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hapus
        </Button>
      </div>
    </div>
  );
}

function TableGrid({
  tables,
  outletSlug,
  outletName,
  isLoading,
  onQr,
  onEdit,
  onDelete,
}: {
  tables: OutletTable[];
  outletSlug?: string;
  outletName?: string;
  isLoading: boolean;
  onQr: (table: OutletTable) => void;
  onEdit?: (table: OutletTable) => void;
  onDelete?: (table: OutletTable) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-lg bg-muted animate-pulse border border-border/50"
          />
        ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <LayoutGrid className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Belum ada meja</p>
        <p className="text-xs text-muted-foreground mt-1">
          Tambahkan meja untuk mulai mengelola tempat duduk.
        </p>
      </div>
    );
  }

  // Status summary
  const summary = Object.entries(STATUS_CONFIG).map(([status, cfg]) => ({
    status: status as TableStatus,
    label: cfg.label,
    dot: cfg.dot,
    count: tables.filter((t) => t.status === status).length,
  }));

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <div className="flex items-center gap-4 flex-wrap">
        {summary
          .filter((s) => s.count > 0)
          .map((s) => (
            <div key={s.status} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", s.dot)} />
              <span className="text-xs text-muted-foreground">
                {s.label}:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {s.count}
                </span>
              </span>
            </div>
          ))}
        <span className="text-xs text-muted-foreground ml-auto">
          Total:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {tables.length} meja
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            outletSlug={outletSlug}
            onQr={onQr}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export function TableManagement({
  outletId,
  outletSlug,
  outletName,
  onAdd,
  onDelete,
  onEdit,
}: TableManagementProps) {
  const [qrTable, setQrTable] = useState<OutletTable | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["tables", outletId],
    queryFn: () => tableApi.getTables(outletId),
  });

  const columns = useMemo<ColumnDef<OutletTable>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nama / Nomor Meja",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-muted/50 text-muted-foreground group-hover:text-primary">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "capacity",
        header: "Kapasitas",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="tabular-nums">
              {row.original.capacity} Orang
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const cfg =
            STATUS_CONFIG[row.original.status] ?? STATUS_CONFIG.AVAILABLE;
          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-black uppercase tracking-tighter",
                cfg.badge,
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full mr-1", cfg.dot)}
              />
              {cfg.label}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  const viewToggle = (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
      <button
        type="button"
        onClick={() => setViewMode("grid")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          viewMode === "grid"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Tampilan Grid"
      >
        <Grid2X2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setViewMode("list")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          viewMode === "list"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Tampilan List"
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {viewMode === "list" ? (
        <DataTable
          columns={columns}
          data={tables}
          isLoading={isLoading}
          title="Manajemen Meja"
          description="Kelola ketersediaan meja dan kapasitas tempat duduk."
          emptyMessage="Belum ada meja yang terdaftar."
          tableId={`tables-${outletId}`}
          titleActions={
            <div className="flex items-center gap-2">
              {outletSlug && tables.length > 0 && (
                <BulkQrDownload
                  tables={tables}
                  outletSlug={outletSlug}
                  outletName={outletName || "Outlet"}
                />
              )}
              {viewToggle}
              <Button
                onClick={() => onAdd?.(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                Tambah Meja
              </Button>
            </div>
          }
          rowActions={() => [
            {
              label: "QR Code",
              icon: QrCode,
              onClick: (row) => setQrTable(row),
            },
            {
              label: "Edit",
              icon: Edit2,
              onClick: (row) => onEdit?.(row),
            },
            {
              label: "Hapus",
              icon: Trash2,
              variant: "destructive",
              onClick: (row) => onDelete?.(row),
            },
          ]}
          actionViewType="flex"
        />
      ) : (
        <div className="space-y-4">
          {/* Grid Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Manajemen Meja</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Kelola ketersediaan meja dan kapasitas tempat duduk.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {outletSlug && tables.length > 0 && (
                <BulkQrDownload
                  tables={tables}
                  outletSlug={outletSlug}
                  outletName={outletName || "Outlet"}
                />
              )}
              {viewToggle}
              <Button
                onClick={() => onAdd?.(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                Tambah Meja
              </Button>
            </div>
          </div>

          <TableGrid
            tables={tables}
            outletSlug={outletSlug}
            outletName={outletName}
            isLoading={isLoading}
            onQr={setQrTable}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}

      <TableQrDialog
        table={qrTable}
        outletSlug={outletSlug}
        onOpenChange={(open) => !open && setQrTable(null)}
      />
    </div>
  );
}