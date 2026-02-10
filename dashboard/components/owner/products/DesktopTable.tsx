"use client";

import React from "react";
import { resolveUploadImageUrl } from "@/lib/url";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { PenBox, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import MobileCard from "./MobileCards";
import { ProductItem } from "@/hooks/useProductsData";

export interface DesktopTableProps {
  products: ProductItem[];
  onEdit: (p: ProductItem) => void;
  onDelete: (p: ProductItem) => void;
  onToggleStatus: (p: ProductItem) => void;
  onRefresh: () => void;
  formatDuration: (n?: number) => string;
  currentPage: number;
  itemsPerPage: number;
  totalProducts: number;
  onPaginationChange: (params: { page: number; limit: number }) => void;
  isFetching?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  serverSideSearch?: boolean;
  searchDebounceMs?: number;
}

export default function DesktopTable({
  products,
  onEdit,
  onDelete,
  onToggleStatus,
  onRefresh,
  formatDuration,
  currentPage,
  itemsPerPage,
  totalProducts,
  onPaginationChange,
  isFetching,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  serverSideSearch,
  searchDebounceMs,
}: DesktopTableProps) {
  const pageSizeOptions = React.useMemo(() => {
    const normalized = Number.isFinite(itemsPerPage) && itemsPerPage > 0 ? itemsPerPage : 10;
    const base = [5, 10, 20, 50, 100];
    if (!base.includes(normalized)) {
      base.push(normalized);
    }
    return base.sort((a, b) => a - b);
  }, [itemsPerPage]);

  return (
    <>
      <DataTable
        data={products}
        onRefresh={onRefresh}
        isRefreshing={isFetching}
        showColumnVisibility
        serverSidePagination
        totalItems={totalProducts}
        serverPage={currentPage}
        serverLimit={itemsPerPage}
        onPaginationChange={onPaginationChange}
        pageSizeOptions={pageSizeOptions}
        serverSideSearch={serverSideSearch}
        onSearchChange={onSearchChange}
        searchValue={searchValue}
        searchPlaceholder={searchPlaceholder}
        searchDebounceMs={searchDebounceMs}
        columns={[
          {
            accessorKey: "name",
            header: "Produk",
            cell(props) {
              const product = props.row.original;

              return (
                <div className="flex items-center w-[180px] gap-3">
                  <img
                    src={resolveUploadImageUrl(product.image)}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/defaults/default-product-image.png";
                    }}
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {product.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            },
          },
          {
            accessorKey: "price",
            header: "Harga",
            cell(props) {
              const product = props.row.original;
              if (product.type === "GOODS") {
                return (
                  <>
                    <div className="text-gray-900 dark:text-gray-100">
                      {formatCurrency(product.goods?.sellingPrice ?? 0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Avg HPP: {formatCurrency(product.goods?.averageHpp ?? 0)}
                    </div>
                  </>
                );
              }
              return (
                <>
                  <div className="text-gray-900 dark:text-gray-100">
                    {formatCurrency(product.service?.sellingPrice ?? 0)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Coms Value:{" "}
                    {formatCurrency(
                      product.service?.commissionType === "PERCENTAGE"
                        ? ((product.service?.sellingPrice ?? 0) *
                          (product.service?.commissionValue ?? 0)) /
                        100
                        : (product.service?.commissionValue ?? 0),
                    )}
                  </div>
                </>
              );
            },
          },
          {
            accessorKey: "type",
            header: "Jenis",
            enableSorting: false,
            cell(props) {
              const product = props.row.original;
              return (
                <Badge
                  className={`${product.type === "GOODS" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                  {product.type === "GOODS" ? "Barang" : "Jasa"}
                </Badge>
              );
            },
          },
          {
            accessorKey: "quantity",
            header: "Stok/Durasi",
            enableSorting: false,
            cell(props) {
              const product = props.row.original;

              return product.type === "GOODS" ? (
                <div>
                  <div>
                    Stok: {product.goods?.currentStock ?? 0} {product.goods?.unit || ""}
                  </div>
                </div>
              ) : (
                <div>Durasi: {formatDuration(product.service?.durationMinutes)}</div>
              );
            },
          },
          {
            accessorKey: "status",
            header: "Status",
            enableSorting: false,
            cell(props) {
              const product = props.row.original;
              return (
                <Switch
                  checked={product.status == "ACTIVE"}
                  onCheckedChange={() => onToggleStatus(product)}
                />
              );
            },
          },
        ]}
        rowActions={() => [
          {
            label: "Edit",
            onClick(row) {
              onEdit(row);
            },
            icon: PenBox,
            variant: "ghost",
            className: "text-blue-700 hover:text-blue-800 hover:bg-blue-100",
          },
          {
            label: "Hapus",
            icon: Trash2,
            variant: "ghost",
            className: "text-red-500 hover:text-red-600 hover:bg-red-100",
            onClick(row) {
              onDelete(row);
            },
          },
        ]}
        actionViewType="flex"
        enableColumnResizing
      />
    </>
  );
}
