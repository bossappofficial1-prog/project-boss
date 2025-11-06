"use client";

import React from 'react';
import { resolveUploadImageUrl } from '@/lib/url';
import { Product } from '@/hooks/useProducts';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { PenBox, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import MobileCard from './MobileCards';

export interface DesktopTableProps {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onToggleStatus: (p: Product) => void;
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
            accessorKey: 'name',
            header: 'Produk',
            cell(props) {
              const product = props.row.original;

              return <div className="flex items-center gap-3">
                <img
                  src={resolveUploadImageUrl(product.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'
                  }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{product.description}</div>
                </div>
              </div>
            },
          },
          {
            accessorKey: 'price',
            header: 'Harga',
            cell(props) {
              const product = props.row.original;
              return (
                <>
                  <div className="text-gray-900 dark:text-gray-100">{formatCurrency(product.price)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Modal: {formatCurrency(product.costPrice)}</div>
                </>
              )
            },
          },
          {
            accessorKey: 'type',
            header: 'Jenis',
            enableSorting: false,
            cell(props) {
              const product = props.row.original
              return <Badge
                className={`${product.type === 'GOODS' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}
              >{product.type === 'GOODS' ? 'Barang' : 'Jasa'}</Badge>
            },
          },
          {
            accessorKey: 'quantity',
            header: 'Stok/Durasi',
            enableSorting: false,
            cell(props) {
              const product = props.row.original;

              return product.type === 'GOODS' ? (
                <div>
                  <div>Stok: {product.quantity ?? 0} {product.unit || ''}</div>
                </div>
              ) : (
                <div>Durasi: {formatDuration(product.serviceDurationMinutes)}</div>
              )
            },
          }
        ]}

        rowActions={() => ([
          {
            label: 'Edit',
            onClick(row) {
              onEdit(row)
            },
            icon: PenBox,
            variant: 'ghost',
            className: 'text-blue-700 hover:text-blue-800 hover:bg-blue-100'
          },
          {
            label: 'Hapus',
            icon: Trash2,
            variant: 'ghost',
            className: 'text-red-500 hover:text-red-600 hover:bg-red-100',
            onClick(row) {
              onDelete(row)
            },
          },
          {
            onClick(row) {
              onToggleStatus(row)
            },
            render(product) {
              return <Switch checked={product.status == 'ACTIVE'}
                onCheckedChange={() => onToggleStatus(product)}
              />
            },
          }
        ])}

        actionViewType='flex'
        enableColumnResizing
        mobileCardRender={(product) => <MobileCard
          formatDuration={formatDuration}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          product={product}
        />}
      />
    </>
  );
}
