import { ExpenseRepository } from '../repositories/expense.repository';
import { z } from 'zod';
import { createExpenseSchema, updateExpenseSchema } from '../schemas/expense.schema';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';
import { getOutletByIdService } from './outlet.service';

type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export class ExpenseService {
    static async createExpense(data: CreateExpenseInput) {
        await getOutletByIdService(data.outletId)
        return ExpenseRepository.create(data);
    }

    static async getExpenseById(id: string) {
        const expense = await ExpenseRepository.findById(id);
        if (!expense) {
            throw new AppError('Pengeluaran tidak ditemukan', HttpStatus.NOT_FOUND);
        }
        return expense;
    }

    static async getExpensesByOutlet(outletId: string, startDate?: string, endDate?: string) {
        await getOutletByIdService(outletId); // Validate outlet exists

        let parsedStartDate: Date | undefined;
        let parsedEndDate: Date | undefined;

        if (startDate && endDate) {
            parsedStartDate = new Date(startDate);
            parsedEndDate = new Date(endDate);

            // Set endDate to end of day
            parsedEndDate.setHours(23, 59, 59, 999);
        }

        const expenses = await ExpenseRepository.findByOutletId(outletId, parsedStartDate, parsedEndDate);

        // Calculate summary
        const summary = expenses.reduce((acc, expense) => {
            return {
                totalTransaksi: acc.totalTransaksi + 1,
                totalPengeluaran: acc.totalPengeluaran + expense.amount
            };
        }, { totalTransaksi: 0, totalPengeluaran: 0 });

        return {
            data: expenses,
            summary
        };
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
