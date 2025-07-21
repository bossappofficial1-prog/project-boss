import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { ResponseUtil } from '../utils/response';
import { ExpenseService } from '../service/expense.service';
import { HttpStatus } from '../constants/http-status';

export const createExpenseController = asyncHandler(async (req: Request, res: Response) => {
    const expense = await ExpenseService.createExpense(req.body);
    ResponseUtil.success(res, expense, HttpStatus.CREATED);
});

export const getExpensesByOutletController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const expenses = await ExpenseService.getExpensesByOutlet(outletId);
    ResponseUtil.success(res, expenses);
});

export const updateExpenseController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const expense = await ExpenseService.updateExpense(id, req.body);
    ResponseUtil.success(res, expense);
});

export const deleteExpenseController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ExpenseService.deleteExpense(id);
    ResponseUtil.success(res, null, HttpStatus.NO_CONTENT);
});
