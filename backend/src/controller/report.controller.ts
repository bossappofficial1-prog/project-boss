import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { ReportService } from "../service/report.service";
import { z } from "zod";
import { exportTransactionReportSchema } from "../schemas/export-report.schema";
import { generateTransactionReportQueue } from "../queues/generate-transaction-report.queue";
import { BusinessRepository } from "../repositories/business.repository";
import { HttpStatus } from "../constants/http-status";

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
  const ownerId = req.storedUser?.id;
  const { type, date } = req.query;

  const report = await ReportService.getOutletReport(
    outletId,
    date as string,
    type as "daily" | "weekly" | "monthly",
    ownerId!,
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
  const ownerId = req.storedUser?.id;

  const report = await ReportService.getStaffReport(
    outletId,
    date as string,
    type as "daily" | "weekly" | "monthly",
    ownerId!,
  );

  return ResponseUtil.success(res, report);
});

export const exportTransactionReportController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.storedUser!;
  const body = exportTransactionReportSchema.parse(req.body);

  // Ambil business dari user
  const business = await BusinessRepository.findById(user.businessId);
  if (!business) {
    return ResponseUtil.error(res, 'Business tidak ditemukan', [], HttpStatus.NOT_FOUND);
  }

  // Tambahkan job ke queue
  await generateTransactionReportQueue.add(
    {
      businessId: business.id,
      startDate: body.startDate,
      endDate: body.endDate,
      // email: 'pitokfauzi@gmail.com',
      email: user.email,
      requestedBy: user.name,
    },
    {
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  );

  return ResponseUtil.success(res, null, HttpStatus.OK, 'Laporan sedang diproses. Akan dikirim ke email Anda.');
});

const exportOutletQuerySchema = z.object({
  type: z.enum(["daily", "weekly", "monthly"]),
  date: z.string().optional(),
  viewMode: z.enum(["time", "compare"]).default("time"),
});

export const exportOutletReportExcelController = asyncHandler(async (req: Request, res: Response) => {
  const outletId = req.params.outletId as string;
  const query = exportOutletQuerySchema.parse(req.query);
  const ownerId = req.storedUser?.id;

  const workbook = await ReportService.exportOutletReportToExcel(
    outletId,
    query.date || new Date().toISOString(),
    query.type,
    query.viewMode,
    ownerId!,
  );

  const filename = `Laporan_Outlet_${new Date().toISOString().split("T")[0]}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

const exportStaffQuerySchema = z.object({
  type: z.enum(["daily", "weekly", "monthly"]),
  date: z.string().optional(),
});

export const exportStaffReportExcelController = asyncHandler(async (req: Request, res: Response) => {
  const outletId = req.params.outletId as string;
  const query = exportStaffQuerySchema.parse(req.query);
  const ownerId = req.storedUser?.id;

  const workbook = await ReportService.exportStaffReportToExcel(
    outletId,
    query.date || new Date().toISOString(),
    query.type,
    ownerId!,
  );

  const filename = `Laporan_Staff_${new Date().toISOString().split("T")[0]}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});
