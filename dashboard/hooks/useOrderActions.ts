import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { orderApi, type GoodsOrder, type OrderStatus } from '@/lib/apis/order';
import { SOCKET_EVENT } from '@/types/socket';
import { useEmitSocket } from './useEmitSocket';
import type { ConfirmDialogProps } from '@/components/ui/confirm-dialog';
import {
    canConfirmPayment,
    canMarkCompleted,
    canMarkReady,
    detectProofUrl,
    formatCurrency,
    formatDateTime,
    formatPaymentMethodLabel,
    getOrderStatusLabel,
} from '@/components/owner/orders/utils';

interface UseOrderActionsOptions {
    onSuccess?: () => Promise<void> | void;
}

interface ConfirmPayload {
    order: GoodsOrder;
    nextStatus: OrderStatus;
    title: string;
    description?: string;
    confirmLabel?: string;
    confirmVariant?: ConfirmDialogProps['confirmVariant'];
}

export function useOrderActions({ onSuccess }: UseOrderActionsOptions = {}) {
    const { emitEvent, isConnected } = useEmitSocket();
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmState, setConfirmState] = useState<ConfirmPayload | null>(null);
    const [proofOrder, setProofOrder] = useState<GoodsOrder | null>(null);

    const resetConfirm = useCallback(() => {
        setConfirmOpen(false);
        setConfirmState(null);
    }, []);

    const triggerProofPreview = useCallback((order: GoodsOrder) => {
        setProofOrder(order);
    }, []);

    const closeProofPreview = useCallback(() => {
        setProofOrder(null);
    }, []);

    const emitStatusUpdate = useCallback((order: GoodsOrder, status: OrderStatus) => {
        try {
            emitEvent(SOCKET_EVENT.ORDER_UPDATE_STATUS, {
                orderId: order.id,
                customerId: order.guestCustomerId ?? order.guestCustomer?.id ?? 'anonymous',
                status,
            });
        } catch (error) {
            console.warn('Gagal mengirim event socket order:updateStatus', error);
        }
    }, [emitEvent]);

    const executeStatusUpdate = useCallback(async () => {
        if (!confirmState) {
            return true;
        }

        const { order, nextStatus } = confirmState;
        if (order.orderStatus === nextStatus) {
            resetConfirm();
            return true;
        }

        setPendingOrderId(order.id);
        try {
            const updated = await orderApi.updateStatus(order.id, nextStatus);
            emitStatusUpdate(order, nextStatus);

            toast.success(
                `Status pesanan #${order.id.slice(-8)} berhasil diubah ke ${getOrderStatusLabel(nextStatus)}.`,
                {
                    description: `Metode ${formatPaymentMethodLabel(order)} • ${formatDateTime(updated.updatedAt ?? new Date())}`,
                }
            );

            await onSuccess?.();
            resetConfirm();
            return true;
        } catch (error: any) {
            console.error('Gagal memperbarui status pesanan', error);
            const message = error?.message ?? 'Terjadi kesalahan saat memperbarui status pesanan';
            toast.error(message);
            return false;
        } finally {
            setPendingOrderId(null);
        }
    }, [confirmState, emitStatusUpdate, onSuccess, resetConfirm]);

    const buildDescription = useCallback((lines: string[]) => lines.filter(Boolean).join('\n'), []);

    const requestStatusUpdate = useCallback(
        (order: GoodsOrder, nextStatus: OrderStatus, overrides?: Partial<Omit<ConfirmPayload, 'order' | 'nextStatus'>>) => {
            if (order.orderStatus === nextStatus) return;

            const statusLabel = getOrderStatusLabel(nextStatus);
            const defaultDescription = buildDescription([
                `Pesanan #${order.id.slice(-8)} akan diubah menjadi ${statusLabel}.`,
                `Total: ${formatCurrency(order.totalAmount)} • Metode: ${formatPaymentMethodLabel(order)}`,
            ]);

            setConfirmState({
                order,
                nextStatus,
                title: overrides?.title ?? 'Konfirmasi ubah status',
                description: overrides?.description ?? defaultDescription,
                confirmLabel: overrides?.confirmLabel ?? 'Ubah Status',
                confirmVariant: overrides?.confirmVariant,
            });
            setConfirmOpen(true);
        },
        [buildDescription]
    );

    const requestManualConfirmation = useCallback((order: GoodsOrder) => {
        const proofUrl = detectProofUrl(order);
        const description = buildDescription([
            'Pastikan pembayaran sudah diterima sebelum melanjutkan.',
            `Pesanan #${order.id.slice(-8)} total ${formatCurrency(order.totalAmount)} melalui ${formatPaymentMethodLabel(order)}.`,
            proofUrl ? 'Bukti pembayaran tersedia, gunakan tombol Lihat Bukti untuk memeriksa.' : 'Tidak ada bukti pembayaran terlampir.',
        ]);

        requestStatusUpdate(order, 'PROCESSING', {
            title: 'Konfirmasi pembayaran manual',
            description,
            confirmLabel: 'Konfirmasi',
        });
    }, [buildDescription, requestStatusUpdate]);

    const requestReady = useCallback((order: GoodsOrder) => {
        requestStatusUpdate(order, 'READY', {
            title: 'Siapkan pesanan',
            confirmLabel: 'Tandai Siap',
        });
    }, [requestStatusUpdate]);

    const requestComplete = useCallback((order: GoodsOrder) => {
        requestStatusUpdate(order, 'COMPLETED', {
            title: 'Selesaikan pesanan',
            confirmLabel: 'Tandai Selesai',
        });
    }, [requestStatusUpdate]);

    const requestCancel = useCallback((order: GoodsOrder) => {
        requestStatusUpdate(order, 'CANCELLED', {
            title: 'Batalkan pesanan',
            confirmLabel: 'Batalkan',
            confirmVariant: 'destructive',
        });
    }, [requestStatusUpdate]);

    const rowActions = useCallback((order: GoodsOrder) => {
        const actions: Array<any> = [];

        if (canConfirmPayment(order)) {
            actions.push({
                label: 'Konfirmasi Pembayaran',
                onClick: () => requestManualConfirmation(order),
            });
        }

        if (canMarkReady(order)) {
            actions.push({
                label: 'Tandai Siap',
                onClick: () => requestReady(order),
            });
        }

        if (canMarkCompleted(order)) {
            actions.push({
                label: 'Tandai Selesai',
                onClick: () => requestComplete(order),
            });
        }

        if (order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED') {
            actions.push({
                label: 'Batalkan Pesanan',
                variant: 'destructive',
                onClick: () => requestCancel(order),
            });
        }

        if (detectProofUrl(order)) {
            actions.push({
                label: 'Lihat Bukti',
                onClick: () => triggerProofPreview(order),
            });
        }

        return actions;
    }, [requestManualConfirmation, requestReady, requestComplete, requestCancel, triggerProofPreview]);

    const isProcessing = useMemo(() => Boolean(pendingOrderId), [pendingOrderId]);

    return {
        pendingOrderId,
        isProcessing,
        isSocketConnected: isConnected,
        confirmState,
        confirmOpen,
        setConfirmOpen: (open: boolean) => {
            if (!open) {
                resetConfirm();
                return;
            }
            setConfirmOpen(open);
        },
        executeStatusUpdate,
        requestStatusUpdate,
        requestManualConfirmation,
        requestReady,
        requestComplete,
        requestCancel,
        rowActions,
        triggerProofPreview,
        closeProofPreview,
        proofOrder,
    };
}
