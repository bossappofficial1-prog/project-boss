'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTransactions } from '@/hooks/use-transactions';
import { useAuth } from '@/features/auth';
import { Authorization } from '@/lib/utils/authorization';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ApprovePaymentButtonProps {
  transactionId: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSuccess?: () => void;
}

/**
 * Reusable Button untuk Approve Payment
 * - Auto role validation
 * - Confirmation dialog
 * - Loading state
 * - Success callback
 */
export function ApprovePaymentButton({
  transactionId,
  disabled = false,
  variant = 'default',
  size = 'sm',
  onSuccess
}: ApprovePaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { useApprovePayment } = useTransactions();
  const { mutate: approvePayment, isPending } = useApprovePayment();

  // Role validation
  const canApprove = Authorization.canApprovePayment(user?.role);

  // Jika tidak punya akses, jangan render button
  if (!canApprove) {
    return null;
  }

  const handleApprove = () => {
    approvePayment(transactionId, {
      onSuccess: () => {
        setOpen(false);
        onSuccess?.();
      }
    });
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
            <CheckCircle className="mr-2 h-4 w-4" />
            Setujui
          </>
        )}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Persetujuan Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menyetujui pembayaran ini?
              <br />
              <strong>Tindakan ini tidak dapat dibatalkan.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Ya, Setujui Pembayaran'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
