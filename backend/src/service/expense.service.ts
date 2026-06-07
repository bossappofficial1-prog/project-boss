import { BaseService } from './base.service';
import { ExpenseRepository } from '../repositories/expense.repository';
import { z } from 'zod';
import { createExpenseSchema, updateExpenseSchema } from '../schemas/expense.schema';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';
import { getOutletByIdService } from './outlet.service';
import { AccountingService } from './accounting.service';
import { AccountingRepository } from '../repositories/accounting.repository';
import axios from 'axios';
import fs from 'fs';

type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export class ExpenseService extends BaseService {
    static async createExpense(data: CreateExpenseInput) {
        await getOutletByIdService(data.outletId);
        return ExpenseRepository.create(data);
    }

    static async getExpenseById(id: string) {
        const expense = await ExpenseRepository.findById(id);
        if (!expense) {
            this.notFound('Pengeluaran tidak ditemukan');
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

    static async scanReceipt(businessId: string, outletId: string, filePath: string, receiptUrl: string) {
        // Validate outlet exists and belongs to the business
        const outlet = await getOutletByIdService(outletId);
        if (!outlet || outlet.businessId !== businessId) {
            this.notFound("Outlet tidak ditemukan");
        }

        let extractedData;
        try {
            const base64Data = fs.readFileSync(filePath).toString("base64");
            const apiKey = process.env.GEMINI_API_KEY;
            
            if (!apiKey || process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_APP_ENV === "production") {
                // If in production or key is missing, return "soon" as requested by user
                throw new AppError("Fitur AI Receipt Scanner segera hadir di lingkungan produksi.", HttpStatus.NOT_IMPLEMENTED);
            }

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Analyze this expense receipt image. Extract the following details as a JSON object:
{
  "amount": number (total amount of the receipt, must be a number),
  "description": string (brief description of what was purchased or the merchant name),
  "date": string (ISO 8601 format, e.g., YYYY-MM-DDTHH:mm:ss.sssZ)
}
Ensure the output is strictly valid JSON and contains nothing else.`
                                },
                                {
                                    inlineData: {
                                        mimeType: "image/webp",
                                        data: base64Data
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                }
            );

            const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error("Gagal mengekstrak data dari struk.");
            }

            const parsed = JSON.parse(text.trim());
            extractedData = {
                amount: typeof parsed.amount === "number" ? parsed.amount : parseFloat(parsed.amount) || 0,
                description: parsed.description || "Pengeluaran dari Struk",
                date: parsed.date ? new Date(parsed.date).toISOString() : new Date().toISOString()
            };
        } catch (err: any) {
            if (err instanceof AppError) throw err;
            console.error("[AI Receipt Scanner] Error processing image:", err?.message || err);
            throw new AppError("Gagal memproses struk dengan AI. Silakan coba lagi atau input manual.", HttpStatus.BAD_REQUEST);
        }

        // Create the expense
        const expense = await ExpenseRepository.create({
            outletId,
            amount: extractedData.amount,
            description: extractedData.description,
            date: extractedData.date,
            cashier: "Owner",
            receiptUrl: receiptUrl
        });

        // Auto-journaling for the created expense
        try {
            const accounts = await AccountingService.getAccounts(businessId);
            
            const findAccountByCode = (code: string) => {
                const acc = accounts.find((a) => a.code === code);
                if (!acc) throw new Error(`Akun dengan kode ${code} tidak ditemukan.`);
                return acc.id;
            };

            const bebanId = findAccountByCode("6005");
            const kasId = findAccountByCode("1001");

            await AccountingRepository.createJournalEntry(businessId, {
                date: new Date(expense.date),
                description: `Pengeluaran Otomatis (Scan Struk) - ${expense.description}`,
                reference: `EXPENSE-${expense.id}`,
                items: [
                    {
                        accountId: bebanId,
                        debit: expense.amount,
                        credit: 0
                    },
                    {
                        accountId: kasId,
                        debit: 0,
                        credit: expense.amount
                    }
                ]
            });
            console.log(`[Auto-Journal] Created journal entry for expense ${expense.id}`);
        } catch (journalErr: any) {
            console.error(`[Auto-Journal] Failed to auto-journal expense ${expense.id}:`, journalErr?.message || journalErr);
        }

        return expense;
    }
}
