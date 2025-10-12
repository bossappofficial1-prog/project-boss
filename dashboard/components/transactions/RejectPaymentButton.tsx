'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { Authorization } from '@/lib/utils/authorization';
import { XCircle, Loader2 } from 'lucide-react';

interface RejectPaymentButtonProps {
  transactionId: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSuccess?: () => void;
}

/**
 * Reusable Button untuk Reject Payment
 * - Auto role validation
 * - Input alasan penolakan (optional)
 * - Loading state
 * - Success callback
 */
export function RejectPaymentButton({
  transactionId,
  disabled = false,
  variant = 'destructive',
  size = 'sm',
  onSuccess
}: RejectPaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { user } = useAuth();
  const { useRejectPayment } = useTransactions();
  const { mutate: rejectPayment, isPending } = useRejectPayment();

  // Role validation
  const canReject = Authorization.canRejectPayment(user?.role);

  if (!canReject) {
    return null;
  }

  const handleReject = () => {
    rejectPayment(
      { id: transactionId, reason: reason || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setReason('');
          onSuccess?.();
        }
      }
    );
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled || isPending}
        variant={variant}
        size={size}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <XCircle className="mr-2 h-4 w-4" />
            Tolak
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pembayaran</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan pembayaran (opsional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Penolakan</Label>
              <Textarea
                id="reason"
                placeholder="Masukkan alasan penolakan..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setReason('');
              }}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Tolak Pembayaran'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
