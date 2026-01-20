"use client";

import type { ColumnDef } from '@tanstack/react-table';
import type { GoodsOrder, OrderStatus } from '@/lib/apis/order';
import { PaymentCell } from './PaymentCell';
import { OrderStatusSelect } from './StatusSelect';
import { formatCurrency, formatDateTime } from './utils';

interface CreateOrderColumnsOptions {
    onStatusChange: (order: GoodsOrder, status: OrderStatus) => void;
    onPreviewProof: (order: GoodsOrder) => void;
    pendingOrderId?: string | null;
}

export function createOrderColumns({
    onStatusChange,
    onPreviewProof,
    pendingOrderId,
}: CreateOrderColumnsOptions): ColumnDef<GoodsOrder, unknown>[] {
    return [
        {
            id: 'no',
            header: 'No',
            cell: ({ row }) => (
                <span className="text-sm font-medium text-muted-foreground">{row.index + 1}</span>
            ),
            enableSorting: false,
            size: 48,
        },
        {
            id: 'orderId',
            header: 'ID Pesanan',
            cell: ({ row }) => (
                <span className="font-mono text-sm font-semibold text-foreground">#{row.original.id}</span>
            ),
        },
        {
            id: 'customer',
            header: 'Customer',
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5 text-sm">
                    <span className="font-medium text-foreground">{row.original.guestCustomer?.name ?? '-'}</span>
                    {row.original.guestCustomer?.phone && (
                        <span className="text-muted-foreground">{row.original.guestCustomer.phone}</span>
                    )}
                </div>
            ),
        },
        {
            id: 'products',
            header: 'Produk',
            cell: ({ row }) => {
                const items = row.original.items ?? [];
                const firstItem = items[0]?.product?.name ?? 'Produk';
                const extra = items.length > 1 ? `+${items.length - 1} item lainnya` : null;
                return (
                    <div className="flex flex-col gap-0.5 text-sm">
                        <span className="font-medium text-foreground">{firstItem}</span>
                        {extra && <span className="text-muted-foreground">{extra}</span>}
                    </div>
                );
            },
        },
        {
            id: 'total',
            header: 'Total',
            cell: ({ row }) => (
                <span className="text-sm font-semibold text-foreground">{formatCurrency(row.original.totalAmount)}</span>
            ),
        },
        {
            id: 'payment',
            header: 'Pembayaran',
            cell: ({ row }) => (
                <PaymentCell order={row.original} onPreviewProof={onPreviewProof} />
            ),
        },
        {
            id: 'createdAt',
            header: 'Waktu Pesan',
            cell: ({ row }) => (
                <span className="text-sm text-foreground">{formatDateTime(row.original.createdAt)}</span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <OrderStatusSelect
                    order={row.original}
                    value={row.original.orderStatus}
                    disabled={pendingOrderId === row.original.id}
                    onStatusChange={onStatusChange}
                />
            ),
        },
    ];
}
