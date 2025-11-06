"use client";
import React from 'react';
import { resolveUploadImageUrl } from '@/lib/url';
import { DataTable } from '@/components/ui/data-table';
import { PenBox } from 'lucide-react';
import StockMobileCards from './MobileCards';

type Item = {
  id: string;
  name: string;
  image?: string;
  quantity?: number;
  unit?: string;
  price: number;
  status: 'ACTIVE' | 'INACTIVE';
};

type Props = {
  items: Item[];
  onUpdateStock: (item: Item) => void;
  formatCurrency: (n: number) => string;
  getStockStatus: (q?: number) => string;
  getStockStatusColor: (q?: number) => string;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  onPaginationChange: (params: { page: number; limit: number }) => void;
  isFetching?: boolean;
  onRefresh?: () => void;
  serverSideSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchDebounceMs?: number;
};

export default function StockDesktopTable({
  items,
  onUpdateStock,
  formatCurrency,
  getStockStatus,
  getStockStatusColor,
  totalItems,
  currentPage,
  itemsPerPage,
  onPaginationChange,
  isFetching,
  onRefresh,
  serverSideSearch = false,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchDebounceMs,
}: Props) {
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
        data={items}
        serverSidePagination
        totalItems={totalItems}
        serverPage={currentPage}
        serverLimit={itemsPerPage}
        onPaginationChange={onPaginationChange}
        pageSizeOptions={pageSizeOptions}
        isRefreshing={isFetching}
        onRefresh={onRefresh}
        serverSideSearch={serverSideSearch}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        searchDebounceMs={searchDebounceMs}
        globalFilter={serverSideSearch}
        columns={[
          {
            accessorKey: `id`,
            header: 'No',
            accessorFn: (item, index) => index + 1
          },
          {
            accessorKey: `name`,
            header: 'Produk',
            enableSorting: false,
            cell: (props) => {
              const item = props.row.original

              return (
                <div className="flex items-center gap-3">
                  <img
                    className="w-12 h-12 rounded-lg object-cover"
                    src={resolveUploadImageUrl(item.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                    alt={item.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
                    }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                  </div>
                </div>)
            }
          },
          {
            accessorKey: `quantity`,
            header: 'Stok',
            cell(props) {
              const item = props.row.original

              return <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900 dark:text-gray-100">{item.quantity || 0}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item.quantity)}`}>
                  {getStockStatus(item.quantity)}
                </span>
              </div>
            },
          },
          {
            accessorKey: 'unit',
            header: 'Satuan',
            enableSorting: false,
            cell(props) {
              const item = props.row.original
              return <span className="text-sm text-gray-900 dark:text-gray-100">{item.unit || 'pcs'}</span>
            },
          },
          {
            accessorKey: 'price',
            header: 'Harga Jual',
            cell(props) {
              const item = props.row.original
              return formatCurrency(item.price)
            },
          },
          {
            accessorKey: 'status',
            header: 'Status',
            enableMultiSort: false,
            enableSorting: false,
            cell(props) {
              const item = props.row.original
              return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {item.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
              </span>
            },
          }
        ]}
        rowActions={(item) => [
          {
            label: `Update Stok`,
            onClick: (row) => onUpdateStock(row),
            icon: PenBox
          }
        ]}

        mobileCardRender={(item) => <StockMobileCards
          item={item}
          onUpdateStock={onUpdateStock}
          formatCurrency={formatCurrency}
          getStockStatus={getStockStatus}
          getStockStatusColor={getStockStatusColor}
        />}
      />
    </>
  );
}
