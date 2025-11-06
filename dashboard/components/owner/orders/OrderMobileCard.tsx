"use client";

import { Button } from '@/components/ui/button';
import type { GoodsOrder, OrderStatus } from '@/lib/apis/order';
import { canConfirmPayment, canMarkCompleted, canMarkReady, formatCurrency, formatDateTime } from './utils';
import { OrderStatusSelect } from './StatusSelect';
import { PaymentCell } from './PaymentCell';

interface OrderMobileCardProps {
    order: GoodsOrder;
    pendingOrderId?: string | null;
    onStatusChange: (order: GoodsOrder, status: OrderStatus) => void;
    onManualConfirm: (order: GoodsOrder) => void;
    onMarkReady: (order: GoodsOrder) => void;
    onMarkCompleted: (order: GoodsOrder) => void;
    onCancel: (order: GoodsOrder) => void;
    onPreviewProof: (order: GoodsOrder) => void;
}

export function OrderMobileCard({
    order,
    pendingOrderId,
    onStatusChange,
    onManualConfirm,
    onMarkReady,
    onMarkCompleted,
    onCancel,
    onPreviewProof,
}: OrderMobileCardProps) {
    const manualConfirmationAvailable = canConfirmPayment(order);
    const readyAvailable = canMarkReady(order);
    const completedAvailable = canMarkCompleted(order);
    const disableActions = pendingOrderId === order.id;

    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">ID Pesanan</p>
                    <p className="text-lg font-semibold text-foreground">#{order.id.slice(-8)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                </div>
                <OrderStatusSelect
                    order={order}
                    value={order.orderStatus}
                    disabled={disableActions}
                    onStatusChange={onStatusChange}
                />
            </div>

            <div className="space-y-3 text-sm">
                <div>
                    <p className="font-medium text-muted-foreground">Customer</p>
                    <p className="text-foreground">{order.guestCustomer?.name ?? '-'}</p>
                    {order.guestCustomer?.phone && <p className="text-muted-foreground">{order.guestCustomer.phone}</p>}
                </div>

                <div>
                    <p className="font-medium text-muted-foreground">Produk</p>
                    <p className="text-foreground">
                        {order.items?.[0]?.product?.name ?? 'Produk'}
                        {order.items && order.items.length > 1 ? ` (+${order.items.length - 1} item)` : ''}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-medium text-muted-foreground">Total</p>
                        <p className="text-lg font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div>
                        <p className="font-medium text-muted-foreground">Pembayaran</p>
                        <PaymentCell order={order} onPreviewProof={onPreviewProof} />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {manualConfirmationAvailable && (
                    <Button
                        type="button"
                        className="flex-1"
                        onClick={() => onManualConfirm(order)}
                        disabled={disableActions}
                    >
                        Konfirmasi Pembayaran
                    </Button>
                )}
                {readyAvailable && (
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onMarkReady(order)}
                        disabled={disableActions}
                    >
                        Tandai Siap
                    </Button>
                )}
                {completedAvailable && (
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onMarkCompleted(order)}
                        disabled={disableActions}
                    >
                        Tandai Selesai
                    </Button>
                )}
                {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED' && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 text-destructive"
                        onClick={() => onCancel(order)}
                        disabled={disableActions}
                    >
                        Batalkan
                    </Button>
                )}
            </div>
        </div>
    );
}
