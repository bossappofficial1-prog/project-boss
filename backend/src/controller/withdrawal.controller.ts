import { Request, Response } from 'express';
import { ResponseUtil } from '../utils';
import { HttpStatus } from '../constants/http-status';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../errors/app-error';
import { db } from '../config/prisma';
import {
    calculateWithdrawalAmount,
    requestWithdrawal,
    processWithdrawal
} from '../service/withdrawal.service';

export const getWithdrawalCalculationController = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId;
    const calculation = await calculateWithdrawalAmount(businessId);
    return ResponseUtil.success(res, calculation, HttpStatus.OK);
});

export const requestWithdrawalController = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId;
    const { amount } = req.body;
    const result = await requestWithdrawal(businessId, amount);
    return ResponseUtil.success(res, result, HttpStatus.CREATED);
});

export const processWithdrawalController = asyncHandler(async (req: Request, res: Response) => {
    const withdrawalId = req.params.id;
    const { action, notes } = req.body as { action: 'APPROVE' | 'REJECT'; notes?: string };

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        throw new AppError('Invalid action. Use APPROVE or REJECT', HttpStatus.BAD_REQUEST);
    }

    if (!req.user?.id) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const withdrawal = await processWithdrawal(withdrawalId, action, req.user.id, notes);
    return ResponseUtil.success(res, withdrawal, HttpStatus.OK);
});

export const getWithdrawalHistoryController = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId;
    const history = await db.withdrawal.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' }
    });
    return ResponseUtil.success(res, history, HttpStatus.OK);
});

// === ADMIN ENDPOINTS ===

export const getAllWithdrawalsController = asyncHandler(async (req: Request, res: Response) => {
    const {
        status,
        page = 1,
        limit = 10,
        businessId,
        startDate,
        endDate
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (businessId) where.businessId = businessId;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [withdrawals, total] = await Promise.all([
        db.withdrawal.findMany({
            where,
            include: {
                business: {
                    select: {
                        id: true,
                        name: true,
                        owner: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                processedBy: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
        }),
        db.withdrawal.count({ where })
    ]);

    return ResponseUtil.success(res, {
        withdrawals,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    }, HttpStatus.OK);
});

export const getWithdrawalStatsController = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const dateFilter = startDate || endDate ? {
        createdAt: {
            ...(startDate && { gte: new Date(startDate as string) }),
            ...(endDate && { lte: new Date(endDate as string) })
        }
    } : {};

    const [
        totalWithdrawals,
        pendingWithdrawals,
        completedWithdrawals,
        rejectedWithdrawals,
        totalAmount,
        pendingAmount,
        completedAmount
    ] = await Promise.all([
        db.withdrawal.count({ where: dateFilter }),
        db.withdrawal.count({ where: { ...dateFilter, status: 'PENDING' } }),
        db.withdrawal.count({ where: { ...dateFilter, status: 'COMPLETED' } }),
        db.withdrawal.count({ where: { ...dateFilter, status: 'REJECTED' } }),
        db.withdrawal.aggregate({
            where: dateFilter,
            _sum: { requestedAmount: true }
        }),
        db.withdrawal.aggregate({
            where: { ...dateFilter, status: 'PENDING' },
            _sum: { requestedAmount: true }
        }),
        db.withdrawal.aggregate({
            where: { ...dateFilter, status: 'COMPLETED' },
            _sum: { finalAmount: true }
        })
    ]);

    return ResponseUtil.success(res, {
        summary: {
            totalWithdrawals,
            pendingWithdrawals,
            completedWithdrawals,
            rejectedWithdrawals,
            totalAmount: totalAmount._sum.requestedAmount || 0,
            pendingAmount: pendingAmount._sum.requestedAmount || 0,
            completedAmount: completedAmount._sum.finalAmount || 0
        },
        recentWithdrawals: await db.withdrawal.findMany({
            where: dateFilter,
            include: {
                business: {
                    select: {
                        name: true,
                        owner: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        })
    }, HttpStatus.OK);
});

export const bulkProcessWithdrawalsController = asyncHandler(async (req: Request, res: Response) => {
    const { withdrawalIds, action, notes } = req.body as {
        withdrawalIds: string[];
        action: 'APPROVE' | 'REJECT';
        notes?: string;
    };

    if (!withdrawalIds || !Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
        throw new AppError('withdrawalIds array is required', HttpStatus.BAD_REQUEST);
    }

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        throw new AppError('Invalid action. Use APPROVE or REJECT', HttpStatus.BAD_REQUEST);
    }

    if (!req.user?.id) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const results = [];
    const errors = [];

    for (const withdrawalId of withdrawalIds) {
        try {
            const result = await processWithdrawal(withdrawalId, action, req.user.id, notes);
            results.push(result);
        } catch (error: any) {
            errors.push({
                withdrawalId,
                error: error.message
            });
        }
    }

    return ResponseUtil.success(res, {
        message: `Processed ${results.length} withdrawals successfully`,
        results,
        errors: errors.length > 0 ? errors : undefined
    }, HttpStatus.OK);
});
