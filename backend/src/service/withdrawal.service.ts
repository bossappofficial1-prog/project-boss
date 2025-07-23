import { db } from '../config/prisma';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';

export async function calculateWithdrawalAmount(businessId: string) {
    // Hitung total dana yang bisa ditarik
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

        // Jika owner yang menanggung fee, kurangi dari revenue
        if (order.chargedTo === 'OWNER') {
            totalMidtransFee += order.midtransFee;
            totalAppFee += order.appFee;
        }
    });

    // Dana bersih yang diterima owner
    const netRevenue = totalRevenue - totalMidtransFee - totalAppFee;

    // Minimal saldo Rp 100.000 untuk bisa withdrawal
    const minimumWithdrawalAmount = 100000;

    return {
        totalOrders: orders.length,
        grossRevenue: totalRevenue,
        midtransFeeDeducted: totalMidtransFee,
        appFeeDeducted: totalAppFee,
        netRevenue,
        canWithdraw: netRevenue >= minimumWithdrawalAmount,
        minimumWithdrawalAmount
    };
}

export async function requestWithdrawal(businessId: string, amount: number) {
    const calculation = await calculateWithdrawalAmount(businessId);

    if (!calculation.canWithdraw) {
        throw new AppError(
            `Withdrawal requires minimum balance of Rp ${calculation.minimumWithdrawalAmount.toLocaleString('id-ID')}. Current balance: Rp ${calculation.netRevenue.toLocaleString('id-ID')}`,
            HttpStatus.BAD_REQUEST
        );
    }

    if (amount > calculation.netRevenue) {
        throw new AppError(
            `Withdrawal amount (${amount}) exceeds available balance (${calculation.netRevenue})`,
            HttpStatus.BAD_REQUEST
        );
    }

    // Hitung fee withdrawal
    const withdrawalMidtransFee = 4000; // Rp 4.000 sesuai diagram
    const withdrawalAppFee = Math.round(amount * 0.02); // 2% dari amount
    const totalWithdrawalFee = withdrawalMidtransFee + withdrawalAppFee;
    const finalAmount = amount - totalWithdrawalFee;

    // Buat record withdrawal
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

export async function processWithdrawal(withdrawalId: string, status: 'COMPLETED' | 'REJECTED') {
    const withdrawal = await db.withdrawal.findUnique({
        where: { id: withdrawalId }
    });

    if (!withdrawal) {
        throw new AppError('Withdrawal not found', HttpStatus.NOT_FOUND);
    }

    if (withdrawal.status !== 'PENDING') {
        throw new AppError('Withdrawal has already been processed', HttpStatus.BAD_REQUEST);
    }

    return await db.withdrawal.update({
        where: { id: withdrawalId },
        data: {
            status,
            processedAt: new Date()
        }
    });
}

export async function getWithdrawalHistory(businessId: string) {
    return await db.withdrawal.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' }
    });
}
