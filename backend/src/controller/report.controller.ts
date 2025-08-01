import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { ResponseUtil } from '../utils/response';
import { ReportService } from '../service/report.service';
import { z } from 'zod';

const summaryQuerySchema = z.object({
    outletId: z.string(),
    startDate: z.string().datetime('Format tanggal awal tidak valid'),
    endDate: z.string().datetime('Format tanggal akhir tidak valid'),
});

export const getFinancialSummaryController = asyncHandler(async (req: Request, res: Response) => {
    const query = summaryQuerySchema.parse(req.query);

    const summary = await ReportService.getFinancialSummary(
        query.outletId,
        new Date(query.startDate),
        new Date(query.endDate)
    );

    ResponseUtil.success(res, summary);
});
