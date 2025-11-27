import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { orderApi, type QueueEntry, type OrderStatus } from '@/lib/apis/order';
import type { ConfirmDialogProps } from '@/components/ui/confirm-dialog';

const statusLabels: Record<OrderStatus, string> = {
    AWAITING_PAYMENT: 'Menunggu Pembayaran',
    PROCESSING: 'Menunggu',
    CONFIRMED: 'Dikonfirmasi',
    READY: 'Siap Dilayani',
    ON_GOING: 'Sedang Dilayani',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
};

const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
    AWAITING_PAYMENT: ['PROCESSING', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['READY', 'CANCELLED'],
    READY: ['ON_GOING', 'COMPLETED', 'CANCELLED'],
    ON_GOING: ['COMPLETED', 'CANCELLED'],
};

const resolveStatus = (entry: QueueEntry): OrderStatus => {
    const status = (entry.status ?? entry.orderStatus) as OrderStatus | undefined;
    return status ?? 'PROCESSING';
};

type ConfirmVariant = ConfirmDialogProps['confirmVariant'];

interface ConfirmState {
    entry: QueueEntry;
    nextStatus: OrderStatus;
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant?: ConfirmVariant;
}

interface QueueActionOverrides {
    title?: string;
    description?: string;
    confirmLabel?: string;
    confirmVariant?: ConfirmVariant;
}

export interface QueuePrimaryAction {
    nextStatus: OrderStatus;
    label: string;
    confirmLabel?: string;
    title?: string;
}

interface UseQueueStatusActionsOptions {
    onSuccess?: () => Promise<void> | void;
}

const formatQueueLabel = (entry: QueueEntry) => {
    const queueNumber = entry.queueMeta?.position ?? entry.position ?? entry.queueNumber;
    if (!queueNumber) {
        return `Order ${entry.id.slice(-6)}`;
    }
    return `Antrian #${queueNumber}`;
};

const formatScheduleInfo = (entry: QueueEntry) => {
    const raw = entry.scheduledStart ?? entry.queueMeta?.scheduledStart ?? entry.bookingSlot?.startTime ?? entry.bookingDate;
    if (!raw) {
        return null;
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const buildDefaultDescription = (entry: QueueEntry, nextStatus: OrderStatus) => {
    const lines: string[] = [];
    const queueLabel = formatQueueLabel(entry);
    const currentStatus = resolveStatus(entry);
    const currentLabel = statusLabels[currentStatus] ?? currentStatus;
    const nextLabel = statusLabels[nextStatus] ?? nextStatus;

    lines.push(`${queueLabel} (${entry.productName ?? 'Layanan'})`);
    lines.push(`Status akan berubah dari "${currentLabel}" menjadi "${nextLabel}".`);

    const scheduleInfo = formatScheduleInfo(entry);
    if (scheduleInfo) {
        lines.push(`Jadwal layanan: ${scheduleInfo}`);
    }

    if (entry.queueMeta?.totalAhead && entry.queueMeta.totalAhead > 0) {
        lines.push(`Masih ada ${entry.queueMeta.totalAhead} antrean di depan.`);
    }

    return lines.join('\n');
};

const primaryActionMap: Partial<Record<OrderStatus, { nextStatus: OrderStatus; label: string; title: string; confirmLabel: string }>> = {
    AWAITING_PAYMENT: {
        nextStatus: 'PROCESSING',
        label: 'Konfirmasi Pembayaran',
        title: 'Konfirmasi Pembayaran Layanan',
        confirmLabel: 'Konfirmasi',
    },
    CONFIRMED: {
        nextStatus: 'PROCESSING',
        label: 'Aktifkan Antrian',
        title: 'Aktifkan Antrian Layanan',
        confirmLabel: 'Aktifkan',
    },
    PROCESSING: {
        nextStatus: 'READY',
        label: 'Tandai Siap',
        title: 'Tandai Layanan Siap',
        confirmLabel: 'Tandai Siap',
    },
    READY: {
        nextStatus: 'ON_GOING',
        label: 'Mulai Layanan',
        title: 'Mulai Layanan',
        confirmLabel: 'Mulai',
    },
    ON_GOING: {
        nextStatus: 'COMPLETED',
        label: 'Selesaikan Layanan',
        title: 'Selesaikan Layanan',
        confirmLabel: 'Selesaikan',
    },
};

export function useQueueStatusActions({ onSuccess }: UseQueueStatusActionsOptions = {}) {
    const [pendingQueueId, setPendingQueueId] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const resetConfirm = useCallback(() => {
        setConfirmOpen(false);
        setConfirmState(null);
    }, []);

    const isValidTransition = useCallback((current: OrderStatus, next: OrderStatus) => {
        if (current === next) {
            return false;
        }
        const allowed = allowedTransitions[current];
        if (!allowed) {
            return false;
        }
        return allowed.includes(next);
    }, []);

    const requestStatusChange = useCallback((entry: QueueEntry, nextStatus: OrderStatus, overrides?: QueueActionOverrides) => {
        const currentStatus = resolveStatus(entry);

        if (currentStatus === nextStatus) {
            return;
        }

        if (!isValidTransition(currentStatus, nextStatus)) {
            toast.error('Perubahan status tidak diperbolehkan untuk tahap ini.');
            return;
        }

        const description = overrides?.description ?? buildDefaultDescription(entry, nextStatus);

        setConfirmState({
            entry,
            nextStatus,
            title: overrides?.title ?? 'Konfirmasi perubahan status',
            description,
            confirmLabel: overrides?.confirmLabel ?? 'Ubah Status',
            confirmVariant: overrides?.confirmVariant,
        });
        setConfirmOpen(true);
    }, [isValidTransition]);

    const getPrimaryAction = useCallback((entry: QueueEntry): QueuePrimaryAction | null => {
        const config = primaryActionMap[resolveStatus(entry)];
        if (!config) {
            return null;
        }

        return {
            nextStatus: config.nextStatus,
            label: config.label,
            confirmLabel: config.confirmLabel,
            title: config.title,
        };
    }, []);

    const requestPrimaryAction = useCallback((entry: QueueEntry) => {
        const currentStatus = resolveStatus(entry);
        const config = primaryActionMap[currentStatus];

        if (!config) {
            return;
        }

        requestStatusChange(entry, config.nextStatus, {
            title: config.title,
            confirmLabel: config.confirmLabel,
        });
    }, [requestStatusChange]);

    const executeStatusUpdate = useCallback(async () => {
        if (!confirmState) {
            return false;
        }

        const { entry, nextStatus } = confirmState;
        setPendingQueueId(entry.id);

        try {
            await orderApi.updateServiceStatus(entry.id, nextStatus);
            const nextLabel = statusLabels[nextStatus];
            toast.success(`${formatQueueLabel(entry)} sekarang berstatus ${nextLabel}.`);
            await onSuccess?.();
            resetConfirm();
            return true;
        } catch (error: any) {
            console.error('Gagal memperbarui status antrian layanan', error);
            const message = error?.response?.data?.message ?? error?.message ?? 'Terjadi kesalahan saat memperbarui status layanan';
            toast.error(message);
            return false;
        } finally {
            setPendingQueueId(null);
        }
    }, [confirmState, onSuccess, resetConfirm]);

    const confirmDescriptor = useMemo(() => confirmState, [confirmState]);

    return {
        pendingQueueId,
        confirmOpen,
        setConfirmOpen: (open: boolean) => {
            if (!open) {
                resetConfirm();
            } else {
                setConfirmOpen(open);
            }
        },
        confirmState: confirmDescriptor,
        executeStatusUpdate,
        requestStatusChange,
        requestPrimaryAction,
        getPrimaryAction,
    };
}
