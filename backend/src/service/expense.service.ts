import { ExpenseRepository } from '../repositories/expense.repository';
import { z } from 'zod';
import { createExpenseSchema, updateExpenseSchema } from '../schemas/expense.schema';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';

type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export class ExpenseService {
    static async createExpense(data: CreateExpenseInput) {
        return ExpenseRepository.create(data);
    }

    static async getExpenseById(id: string) {
        const expense = await ExpenseRepository.findById(id);
        if (!expense) {
            throw new AppError('Pengeluaran tidak ditemukan', HttpStatus.NOT_FOUND);
        }
        return expense;
    }

    static async getExpensesByOutlet(outletId: string) {
        return ExpenseRepository.findByOutletId(outletId);
    }

    static async updateExpense(id: string, data: UpdateExpenseInput) {
        await this.getExpenseById(id); // Pastikan data ada
        return ExpenseRepository.update(id, data);
    }

    static async deleteExpense(id: string) {
        await this.getExpenseById(id); // Pastikan data ada
        return ExpenseRepository.delete(id);
    }
}
