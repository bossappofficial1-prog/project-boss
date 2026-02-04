import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { ReportService } from "../service/report.service";
import { z } from "zod";

const summaryQuerySchema = z.object({
  outletId: z.string(),
  startDate: z.string().datetime("Format tanggal awal tidak valid"),
  endDate: z.string().datetime("Format tanggal akhir tidak valid"),
});

export const getFinancialSummaryController = asyncHandler(async (req: Request, res: Response) => {
  const query = summaryQuerySchema.parse(req.query);

  const summary = await ReportService.getFinancialSummary(
    query.outletId,
    new Date(query.startDate),
    new Date(query.endDate),
  );

  ResponseUtil.success(res, summary);
});

export const getOutletReportController = asyncHandler(async (req: Request, res: Response) => {
  const outletId = req.params.outletId as string;
  const { type, date } = req.query;

  const report = await ReportService.getOutletReport(
    outletId,
    date as string,
    type as "daily" | "weekly" | "monthly",
  );

  return ResponseUtil.success(res, report);
});

export const getCompareOutletsReportController = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, date } = req.query;
    const ownerId = req.storedUser?.id;

    if (!ownerId) {
      throw new Error("User not found");
    }

    const report = await ReportService.getCompareOutletsReport(
      date as string,
      type as "daily" | "monthly" | "yearly",
      ownerId,
    );

    return ResponseUtil.success(res, report);
  },
);

export const getStaffReportController = asyncHandler(async (req: Request, res: Response) => {
  const outletId = req.params.outletId as string;
  const { type, date } = req.query;

  const report = await ReportService.getStaffReport(
    outletId,
    date as string,
    type as "daily" | "weekly" | "monthly",
  );

  return ResponseUtil.success(res, report);
});
