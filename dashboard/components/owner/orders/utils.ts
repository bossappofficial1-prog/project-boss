import type { GoodsOrder, OrderStatus } from '@/lib/apis/order';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    manual_transfer: 'Manual Transfer',
    manual: 'Manual',
    cash: 'Cash',
    qris: 'QRIS',
    qris_dynamic: 'QRIS Dynamic',
    online: 'Online',
    midtrans: 'Midtrans',
};

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
    { value: 'AWAITING_PAYMENT', label: 'Menunggu Bayar' },
    { value: 'PROCESSING', label: 'Diproses' },
    { value: 'CONFIRMED', label: 'Dikonfirmasi' },
    { value: 'READY', label: 'Siap Diambil' },
    { value: 'ON_GOING', label: 'Sedang Berjalan' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
];

function normalizeString(value?: string | null): string {
    if (!value) return '';
    return String(value).trim();
}

export function detectProofUrl(order: GoodsOrder): string | null {
    const anyOrder = order as unknown as Record<string, any>;
    const tx = anyOrder.transaction ?? {};

    const candidates = [
        tx.paymentProofUrl,
        tx.proofUrl,
        tx.manualProofUrl,
        anyOrder.paymentProofUrl,
        anyOrder.proofUrl,
        anyOrder.payment?.proofUrl,
        anyOrder.manualPaymentProofUrl,
    ];

    const url = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);
    return url ? String(url) : null;
}

export function isManualPayment(order: GoodsOrder): boolean {
    const anyOrder = order as unknown as Record<string, any>;
    const tx = anyOrder.transaction ?? {};

    if (typeof tx.isManual === 'boolean') {
        return tx.isManual;
    }

    const method = normalizeString(tx.paymentMethod ?? anyOrder.paymentMethod ?? anyOrder.transaction?.manualMethod);
    if (!method) return false;

    return ['manual', 'manual_transfer', 'transfer', 'cash'].some((keyword) => method.toLowerCase().includes(keyword));
}

export function formatPaymentMethodLabel(order: GoodsOrder): string {
    const anyOrder = order as unknown as Record<string, any>;
    const tx = anyOrder.transaction ?? {};
    const rawMethod = normalizeString(tx.paymentMethod ?? anyOrder.paymentMethod ?? tx.manualMethod ?? anyOrder.method);

    if (!rawMethod) return 'Online';

    const normalized = rawMethod.toLowerCase();
    if (PAYMENT_METHOD_LABELS[normalized]) {
        return PAYMENT_METHOD_LABELS[normalized];
    }

    return rawMethod
        .split(/[_-]/g)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function extractPaymentStatus(order: GoodsOrder): string | undefined {
    const anyOrder = order as unknown as Record<string, any>;
    return anyOrder.transaction?.status ?? anyOrder.paymentStatus;
}

export function getOrderStatusOptions(): Array<{ value: OrderStatus; label: string }> {
    return STATUS_OPTIONS;
}

export function getOrderStatusLabel(status: OrderStatus): string {
    return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status.replace(/_/g, ' ');
}

export function canConfirmPayment(order: GoodsOrder): boolean {
    const status = order.orderStatus;
    const paymentStatus = normalizeString(extractPaymentStatus(order));
    const proofUrl = detectProofUrl(order);

    if (status === 'AWAITING_PAYMENT' && !isManualPayment(order)) {
        // For gateway payments, allow owner to confirm in case auto-settlement is off.
        return true;
    }

    const manual = isManualPayment(order);
    if (!manual) return false;

    return status === 'AWAITING_PAYMENT' || paymentStatus === 'awaiting_verification' || Boolean(proofUrl);
}

export function canMarkReady(order: GoodsOrder): boolean {
    return order.orderStatus === 'PROCESSING' || order.orderStatus === 'CONFIRMED';
}

export function canMarkCompleted(order: GoodsOrder): boolean {
    return order.orderStatus === 'READY' || order.orderStatus === 'ON_GOING';
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function formatDateTime(date: string | Date): string {
    const instance = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(instance.getTime())) return '-';
    return instance.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
