import path from 'node:path';
import fs from 'node:fs/promises';
import type { Job } from 'bull';
import { subDays } from 'date-fns';
import { PaymentStatus, Prisma } from '@prisma/client';
import { db } from '../config/prisma';
import Console from '../utils/logger';

const AUTO_CLEANUP_NOTE = 'Bukti pembayaran dihapus otomatis setelah melewati 3 hari';
const UPLOADS_MARKER = '/uploads/';

function resolveLocalPath(publicUrl: string): string | null {
    const markerIndex = publicUrl.indexOf(UPLOADS_MARKER);
    if (markerIndex === -1) {
        return null;
    }

    const relativePath = publicUrl.slice(markerIndex + 1); // keep "uploads/..."
    return path.join(process.cwd(), relativePath);
}

export async function processPaymentProofCleanup() {
    const thresholdDate = subDays(new Date(), 3);
    Console.log(`Running payment proof cleanup job for files older than ${thresholdDate.toISOString()}`);

    const staleTransactions = await db.transaction.findMany({
        where: {
            isManual: true,
            paymentProofUrl: { not: null },
            proofUploadedAt: { lt: thresholdDate },
        },
        select: {
            id: true,
            paymentProofUrl: true,
            status: true,
        },
    });

    if (!staleTransactions.length) {
        Console.log('No payment proofs to clean up.');
        return;
    }

    Console.log(`Found ${staleTransactions.length} manual payment(s) with stale proofs.`);

    for (const transaction of staleTransactions) {
        if (!transaction.paymentProofUrl) {
            continue;
        }

        const localPath = resolveLocalPath(transaction.paymentProofUrl);

        if (localPath) {
            try {
                await fs.unlink(localPath);
                Console.log(`Deleted payment proof file: ${localPath}`);
            } catch (error: any) {
                if (error?.code === 'ENOENT') {
                    Console.warn(`Payment proof file already removed: ${localPath}`);
                } else {
                    Console.error(`Failed to delete payment proof file ${localPath}`, error);
                }
            }
        } else {
            Console.warn(`Unable to resolve local path for payment proof URL: ${transaction.paymentProofUrl}`);
        }

        const updatePayload: Prisma.TransactionUpdateInput = {
            paymentProofUrl: null,
            proofUploadedAt: null,
        };

        if (transaction.status === PaymentStatus.AWAITING_VERIFICATION) {
            updatePayload.status = PaymentStatus.PENDING;
            updatePayload.rejectionNote = AUTO_CLEANUP_NOTE;
        }

        await db.transaction.update({
            where: { id: transaction.id },
            data: updatePayload,
        });
    }

    Console.log('Payment proof cleanup job completed.');
}
