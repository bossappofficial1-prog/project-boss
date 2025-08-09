import { db } from '../config/prisma';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';
import { config } from '../config';
import { WithdrawalStatus } from '@prisma/client';
import axios from 'axios';

export async function calculateWithdrawalAmount(businessId: string) {
    // Hitung total dana yang bisa ditarik dari order yang sudah selesai dan paid
    const orders = await db.order.findMany({
        where: {
            outlet: { businessId },
            paymentStatus: 'SUCCESS',
            orderStatus: 'COMPLETED'
        },
        select: {
            totalAmount: true,
            midtransFee: true,
            appFee: true,
            chargedTo: true
        }
    });

    let totalRevenue = 0;
    let totalMidtransFee = 0;
    let totalAppFee = 0;

    orders.forEach(order => {
        totalRevenue += order.totalAmount;
        if (order.chargedTo === 'OWNER') {
            totalMidtransFee += order.midtransFee;
            totalAppFee += order.appFee;
        }
    });

    // Dana bersih yang diterima owner
    const netRevenue = totalRevenue - totalMidtransFee - totalAppFee;

    // Kurangi request withdrawal yang masih PENDING/PROCESSING (belum selesai)
    const pendingRequested = await db.withdrawal.aggregate({
        where: {
            businessId,
            status: { in: ['PENDING', 'PROCESSING'] as WithdrawalStatus[] }
        },
        _sum: { requestedAmount: true }
    });

    const reservedAmount = pendingRequested._sum.requestedAmount || 0;
    const availableBalance = Math.max(netRevenue - reservedAmount, 0);

    // Minimal saldo Rp 100.000 untuk bisa withdrawal
    const minimumWithdrawalAmount = 100000;

    return {
        totalOrders: orders.length,
        grossRevenue: totalRevenue,
        midtransFeeDeducted: totalMidtransFee,
        appFeeDeducted: totalAppFee,
        netRevenue,
        reservedAmount,
        availableBalance,
        canWithdraw: availableBalance >= minimumWithdrawalAmount,
        minimumWithdrawalAmount
    };
}

export async function requestWithdrawal(businessId: string, amount: number) {
    const calculation = await calculateWithdrawalAmount(businessId);

    if (!calculation.canWithdraw) {
        throw new AppError(
            `Withdrawal requires minimum balance of Rp ${calculation.minimumWithdrawalAmount.toLocaleString('id-ID')}. Available: Rp ${calculation.availableBalance.toLocaleString('id-ID')}`,
            HttpStatus.BAD_REQUEST
        );
    }

    if (amount > calculation.availableBalance) {
        throw new AppError(
            `Withdrawal amount (${amount}) exceeds available balance (${calculation.availableBalance})`,
            HttpStatus.BAD_REQUEST
        );
    }

    // Hitung fee withdrawal (simulasi manual: fee tetap dicatat untuk transparansi)
    const withdrawalMidtransFee = 4000;
    const withdrawalAppFee = Math.round(amount * 0.02);
    const totalWithdrawalFee = withdrawalMidtransFee + withdrawalAppFee;
    const finalAmount = amount - totalWithdrawalFee;

    const withdrawal = await db.withdrawal.create({
        data: {
            businessId,
            requestedAmount: amount,
            midtransFee: withdrawalMidtransFee,
            appFee: withdrawalAppFee,
            finalAmount,
            status: 'PENDING'
        }
    });

    return {
        withdrawal,
        breakdown: {
            requestedAmount: amount,
            midtransFee: withdrawalMidtransFee,
            appFee: withdrawalAppFee,
            totalFee: totalWithdrawalFee,
            finalAmount
        }
    };
}

// Manual processing by admin
export async function processWithdrawal(
    withdrawalId: string,
    action: 'APPROVE' | 'REJECT',
    adminUserId: string,
    notes?: string
) {
    const withdrawal = await db.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: { business: true }
    });

    if (!withdrawal) {
        throw new AppError('Withdrawal request not found', HttpStatus.NOT_FOUND);
    }

    if (withdrawal.status !== 'PENDING') {
        throw new AppError(`Cannot process withdrawal with status ${withdrawal.status}`, HttpStatus.BAD_REQUEST);
    }

    if (action === 'REJECT') {
        return db.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: 'REJECTED',
                processedAt: new Date(),
                processedById: adminUserId,
                notes
            }
        });
    }

    // APPROVE: tandai selesai secara manual (admin telah transfer manual)
    return db.withdrawal.update({
        where: { id: withdrawalId },
        data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            processedById: adminUserId,
            notes: notes || 'Approved and processed manually by admin.'
        }
    });
}

// Webhook handlers dan integrasi otomatis disimpan untuk masa depan,
// namun tidak dipakai pada mode manual. Biarkan tetap ada jika diperlukan.
// ...existing code...
