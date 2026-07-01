import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { ResponseUtil } from '../utils/response';
import { DailyReportService } from '../service/daily-report.service';
import { z } from 'zod';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';
import { WIBUtil } from '../utils/date';

// Validation schema for query parameters
const dateRangeSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
});

export const getDailyReportController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate date parameters if provided
    if (startDate || endDate) {
        try {
            dateRangeSchema.parse({ startDate, endDate });
        } catch (error) {
            throw new AppError('Format tanggal tidak valid. Gunakan format YYYY-MM-DD', HttpStatus.BAD_REQUEST);
        }
    }

    const report = await DailyReportService.getDailyReport(
        outletId as string,
        startDate ? new Date(`${startDate}T00:00:00+07:00`) : undefined,
        endDate ? WIBUtil.endOfDayWIB(new Date(endDate)) : undefined
    );

    ResponseUtil.success(res, { daily: report.data, summary: report.summary });
});
