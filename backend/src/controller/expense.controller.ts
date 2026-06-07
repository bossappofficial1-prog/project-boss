import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { ExpenseService } from '../service/expense.service';
import { HttpStatus } from '../constants/http-status';
import { ensureString } from '../utils/request';
import { optimizeUploadedImage } from '../utils/image-optimizer';
import { moderationQueue } from '../queues/moderation.queue';
import { config } from '../config';
import path from 'path';

class ExpenseController extends BaseController {
    create = this.handler(async (req: Request, res: Response) => {
        const expense = await ExpenseService.createExpense(req.body);
        return this.success(res, expense, HttpStatus.CREATED);
    });

    getByOutlet = this.handler(async (req: Request, res: Response) => {
        const outletId = ensureString(req.params?.outletId, 'outletId');
        const startDate = req.query?.startDate ? ensureString(req.query.startDate, 'startDate') : undefined;
        const endDate = req.query?.endDate ? ensureString(req.query.endDate, 'endDate') : undefined;

        const expenses = await ExpenseService.getExpensesByOutlet(
            outletId,
            startDate,
            endDate
        );

        return this.success(res, expenses);
    });

    update = this.handler(async (req: Request, res: Response) => {
        const id = ensureString(req.params?.id, 'id');
        const expense = await ExpenseService.updateExpense(id, req.body);
        return this.success(res, expense);
    });

    delete = this.handler(async (req: Request, res: Response) => {
        const id = ensureString(req.params?.id, 'id');
        await ExpenseService.deleteExpense(id);
        return this.success(res, null, HttpStatus.NO_CONTENT);
    });

    scanReceipt = this.handler(async (req: Request, res: Response) => {
        const file = req.file;
        if (!file) {
            return this.error(res, "File struk tidak ditemukan", [], HttpStatus.BAD_REQUEST);
        }

        const outletId = req.body.outletId as string;
        if (!outletId) {
            return this.error(res, "ID Outlet wajib diisi", [], HttpStatus.BAD_REQUEST);
        }

        const businessId = req.storedUser!.businessId;

        // 1. Optimize uploaded receipt image
        let optimizedFile;
        try {
            optimizedFile = await optimizeUploadedImage(file);
        } catch (err) {
            return this.error(res, "Gagal mengompresi gambar struk", [], HttpStatus.BAD_REQUEST);
        }

        // 2. Queue moderation in background
        await moderationQueue.add({
            filePath: optimizedFile.path,
            filename: optimizedFile.filename
        });

        // 3. Generate image URL
        const baseUrl = config.BASE_URL;
        const relativePath = path.relative(process.cwd(), optimizedFile.path);
        const receiptUrl = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;

        // 4. Scan receipt with Gemini and save
        const expense = await ExpenseService.scanReceipt(businessId, outletId, optimizedFile.path, receiptUrl);

        return this.success(res, expense, HttpStatus.CREATED, "Struk berhasil diproses dan dicatat otomatis");
    });
}

export const expenseController = new ExpenseController();
