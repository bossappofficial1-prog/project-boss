"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GoodsOrder } from '@/lib/apis/order';
import { detectProofUrl, extractPaymentStatus, formatPaymentMethodLabel, isManualPayment } from './utils';

interface PaymentCellProps {
    order: GoodsOrder;
    onPreviewProof?: (order: GoodsOrder) => void;
}

export function PaymentCell({ order, onPreviewProof }: PaymentCellProps) {
    const proofUrl = detectProofUrl(order);
    const paymentStatus = extractPaymentStatus(order);
    const manual = isManualPayment(order);

    return (
        <div className="flex flex-col gap-1 text-sm text-foreground">
            <div className="flex items-center gap-2">
                <span className="font-medium">{formatPaymentMethodLabel(order)}</span>
                {manual && (
                    <Badge variant="outline" className="text-[0.65rem] uppercase tracking-tight">
                        Manual
                    </Badge>
                )}
            </div>

            {paymentStatus && (
                <span className="text-xs text-muted-foreground capitalize">
                    Status pembayaran: {paymentStatus.replace(/_/g, ' ').toLowerCase()}
                </span>
            )}

            {proofUrl && (
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="px-0 h-auto text-xs font-medium text-primary"
                    onClick={() => onPreviewProof?.(order)}
                >
                    Lihat bukti
                </Button>
            )}
        </div>
    );
}
