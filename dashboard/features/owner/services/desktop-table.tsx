"use client";

import { PenBox } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { DataTable } from '@/components/ui/data-table';
import { ServiceItem } from '@/hooks/use-services-data';
import { resolveUploadImageUrl } from '@/lib/url';

interface DesktopTableProps {
  services: ServiceItem[];
  onEdit: (s: ServiceItem) => void;
  onRefresh: () => void;
  formatCurrency: (n: number) => string;
  formatDuration: (n?: number) => string;
  currentPage: number;
  itemsPerPage: number;
  totalServices: number;
  onPaginationChange: (params: { page: number; limit: number }) => void;
  isFetching?: boolean;
}

export default function ServicesDesktopTable({
  services,
  onEdit,
  onRefresh,
  formatCurrency,
  formatDuration,
  currentPage,
  itemsPerPage,
  totalServices,
  onPaginationChange,
  isFetching,
}: DesktopTableProps) {
  const pageSizeOptions = useMemo(() => {
    const base = [5, 10, 20, 50, 100];
    if (!base.includes(itemsPerPage)) {
      base.push(itemsPerPage);
    }
    return base.sort((a, b) => a - b);
  }, [itemsPerPage]);

  const columns = useMemo<ColumnDef<ServiceItem>[]>(() => {
    return [
      {
        id: 'no',
        header: 'No',
        enableSorting: false,
        enableHiding: false,
        size: 60,
        cell: ({ row }) => {
          const rowNumber = (currentPage - 1) * itemsPerPage + row.index + 1;
          return <span className="text-sm text-muted-foreground">{rowNumber}</span>;
        },
      },
      {
        accessorKey: 'name',
        header: 'Jasa',
        enableSorting: false,
        cell: ({ row }) => {
          const service = row.original;

          return (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-12 w-12 rounded-lg object-cover"
                src={resolveUploadImageUrl(service.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                alt={service.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
                }}
              />
              <div>
                <div className="text-sm font-medium text-foreground">{service.name}</div>
                {service.description && (
                  <div className="text-xs text-muted-foreground line-clamp-1">{service.description}</div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'price',
        header: 'Harga',
        cell: ({ row }) => {
          const service = row.original;

          return (
            <div className="space-y-1 text-sm">
              <div className="font-medium text-foreground">{formatCurrency(service.price)}</div>
              <div className="text-xs text-muted-foreground">Modal: {formatCurrency(service.costPrice)}</div>
            </div>
          );
        },
      },
      {
        id: 'duration',
        header: 'Durasi',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{formatDuration(row.original.serviceDurationMinutes)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => {
          const service = row.original;
          const isActive = service.status === 'ACTIVE';
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
            >
              {isActive ? 'Aktif' : 'Tidak Aktif'}
            </span>
          );
        },
      },
    ];
  }, [currentPage, formatCurrency, formatDuration, itemsPerPage]);

  return (
    <div className="hidden sm:block">
      <DataTable
        data={services}
        columns={columns}
        globalFilter={false}
        showColumnVisibility
        emptyMessage="Belum ada jasa."
        labelAction="Aksi"
        serverSidePagination
        totalItems={totalServices}
        serverPage={currentPage}
        serverLimit={itemsPerPage}
        onPaginationChange={onPaginationChange}
        pageSizeOptions={pageSizeOptions}
        onRefresh={onRefresh}
        isRefreshing={isFetching}
        rowActions={(service) => [
          {
            label: 'Edit',
            onClick: () => onEdit(service),
            icon: PenBox,
            variant: 'ghost',
            className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50',
          },
        ]}
      />
    </div>
  );
}
