import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { ResponseUtil } from '../utils/response';
import { ExpenseService } from '../service/expense.service';
import { HttpStatus } from '../constants/http-status';
import { ensureString } from '../utils/request';

export const createExpenseController = asyncHandler(async (req: Request, res: Response) => {
    const expense = await ExpenseService.createExpense(req.body);
    ResponseUtil.success(res, expense, HttpStatus.CREATED);
});

export const getExpensesByOutletController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = ensureString(req.params?.outletId, 'outletId');
    const startDate = req.query?.startDate ? ensureString(req.query.startDate, 'startDate') : undefined;
    const endDate = req.query?.endDate ? ensureString(req.query.endDate, 'endDate') : undefined;

    const expenses = await ExpenseService.getExpensesByOutlet(
        outletId,
        startDate,
        endDate
    );

    ResponseUtil.success(res, expenses.data);
});

export const updateExpenseController = asyncHandler(async (req: Request, res: Response) => {
    const id = ensureString(req.params?.id, 'id');
    const expense = await ExpenseService.updateExpense(id, req.body);
    ResponseUtil.success(res, expense);
});

export const deleteExpenseController = asyncHandler(async (req: Request, res: Response) => {
    const id = ensureString(req.params?.id, 'id');
    await ExpenseService.deleteExpense(id);
    ResponseUtil.success(res, null, HttpStatus.NO_CONTENT);
});
