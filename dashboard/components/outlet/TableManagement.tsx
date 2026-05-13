"use client";

import React, { useState, useMemo } from "react";
import { Plus, Trash2, Edit2, Users, LayoutGrid, QrCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { tableApi, type OutletTable } from "@/lib/apis/table";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { TableQrDialog, BulkQrDownload } from "./TableQrDialog";

// Project UI Components
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

interface TableManagementProps {
  outletId: string;
  outletSlug?: string;
  outletName?: string;
  onEdit?: (table: OutletTable) => void;
  onDelete?: (table: OutletTable) => void;
}

export function TableManagement({
  outletId,
  outletSlug,
  outletName,
  onDelete,
  onEdit,
}: TableManagementProps) {
  const [qrTable, setQrTable] = useState<OutletTable | null>(null);

  // Queries
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["tables", outletId],
    queryFn: () => tableApi.getTables(outletId),
  });

  // Columns Definition
  const columns = useMemo<ColumnDef<OutletTable>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nama / Nomor Meja",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
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
            <span className="tabular-nums">{row.original.capacity} Orang</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const config = {
            AVAILABLE: {
              label: "Tersedia",
              class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            },
            OCCUPIED: {
              label: "Terisi",
              class: "bg-red-500/10 text-red-600 border-red-500/20",
            },
            RESERVED: {
              label: "Dipesan",
              class: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            },
            BILLED: {
              label: "Dipesan",
              class: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            },
          }[status] || {
            label: status,
            class: "bg-muted text-muted-foreground",
          };

          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-black uppercase tracking-tighter",
                config.class,
              )}
            >
              {config.label}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={tables}
        isLoading={isLoading}
        title="Manajemen Meja"
        description="Kelola ketersediaan meja dan kapasitas tempat duduk."
        emptyMessage="Belum ada meja yang terdaftar."
        tableId={`tables-${outletId}`}
        titleActions={
          outletSlug && tables.length > 0 ? (
            <BulkQrDownload
              tables={tables}
              outletSlug={outletSlug}
              outletName={outletName || "Outlet"}
            />
          ) : undefined
        }
        rowActions={(row) => [
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

      <TableQrDialog
        table={qrTable}
        outletSlug={outletSlug}
        onOpenChange={(open) => !open && setQrTable(null)}
      />
    </div>
  );
}
