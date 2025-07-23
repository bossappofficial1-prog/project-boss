import { Request, Response } from 'express';
import { ResponseUtil } from '../utils';
import { HttpStatus } from '../constants/http-status';
import { asyncHandler } from '../middleware/error.middleware';
import {
    calculateWithdrawalAmount,
    requestWithdrawal,
    processWithdrawal,
    getWithdrawalHistory
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
    const { status } = req.body;
    const withdrawal = await processWithdrawal(withdrawalId, status);
    return ResponseUtil.success(res, withdrawal, HttpStatus.OK);
});

export const getWithdrawalHistoryController = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId;
    const history = await getWithdrawalHistory(businessId);
    return ResponseUtil.success(res, history, HttpStatus.OK);
});
