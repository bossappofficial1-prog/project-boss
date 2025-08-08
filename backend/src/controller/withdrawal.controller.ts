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
