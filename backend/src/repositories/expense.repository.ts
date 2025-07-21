import { db } from '../config/prisma';
import { z } from 'zod';
import { createExpenseSchema } from '../schemas/expense.schema';

type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export class ExpenseRepository {
    static async create(data: CreateExpenseInput) {
        return db.expense.create({
            data: {
                ...data,
                date: new Date(data.date),
            },
        });
    }

    static async findById(id: string) {
        return db.expense.findUnique({ where: { id } });
    }

    static async findByOutletId(outletId: string) {
        return db.expense.findMany({
            where: { outletId },
            orderBy: { date: 'desc' },
        });
    }

    static async update(id: string, data: Partial<CreateExpenseInput>) {
        return db.expense.update({
            where: { id },
            data: {
                ...data,
                ...(data.date && { date: new Date(data.date) }),
            },
        });
    }

    static async delete(id: string) {
        return db.expense.delete({ where: { id } });
    }
}
