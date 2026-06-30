import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { ReportService } from "../service/report.service";
import { HttpStatus } from "../constants/http-status";
import { z } from "zod";
import { exportTransactionReportSchema } from "../schemas/export-report.schema";
import { generateTransactionReportQueue } from "../queues/generate-transaction-report.queue";
import { BusinessRepository } from "../repositories/business.repository";

const summaryQuerySchema = z.object({
  outletId: z.string(),
  startDate: z.string().datetime("Format tanggal awal tidak valid"),
  endDate: z.string().datetime("Format tanggal akhir tidak valid"),
});

const exportOutletQuerySchema = z.object({
  type: z.enum(["daily", "weekly", "monthly", "yearly"]),
  date: z.string().optional(),
  viewMode: z.enum(["time", "compare"]).default("time"),
});

const exportStaffQuerySchema = z.object({
  type: z.enum(["daily", "weekly", "monthly", "yearly"]),
  date: z.string().optional(),
});

export class ReportController extends BaseController {
  constructor(private reportService: ReportService) {
    super();
  }

  getFinancialSummary = this.handler(async (req: Request, res: Response) => {
    const query = summaryQuerySchema.parse(req.query);
    const summary = await this.reportService.getFinancialSummary(
      query.outletId,
      new Date(query.startDate),
      new Date(query.endDate),
    );
    return this.success(res, summary);
  });

  getOutletReport = this.handler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const ownerId = (req as any).storedUser?.id;
    const { type, date } = req.query;

    const report = await this.reportService.getOutletReport(
      outletId,
      date as string,
      type as "daily" | "weekly" | "monthly" | "yearly",
      ownerId!,
    );

    return this.success(res, report);
  });

  getCompareOutletsReport = this.handler(async (req: Request, res: Response) => {
    const { type, date } = req.query;
    const businessId = (req as any).storedUser?.businessId;

    if (!businessId) {
      return this.error(res, "Business not found", [], HttpStatus.UNAUTHORIZED);
    }

    const report = await this.reportService.getCompareOutletsReport(
      date as string,
      type as "daily" | "monthly" | "yearly",
      businessId,
    );

    return this.success(res, report);
  });

  getStaffReport = this.handler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const { type, date } = req.query;
    const ownerId = (req as any).storedUser?.id;

    const report = await this.reportService.getStaffReport(
      outletId,
      date as string,
      type as "daily" | "weekly" | "monthly" | "yearly",
      ownerId!,
    );

    return this.success(res, report);
  });

  exportTransactionReport = this.handler(async (req: Request, res: Response) => {
    const user = (req as any).storedUser!;
    const body = exportTransactionReportSchema.parse(req.body);

    const business = await BusinessRepository.findById(user.businessId);
    if (!business) {
      return this.error(res, "Business tidak ditemukan", [], HttpStatus.NOT_FOUND);
    }

    await generateTransactionReportQueue.add(
      {
        businessId: business.id,
        startDate: body.startDate,
        endDate: body.endDate,
        email: user.email,
        requestedBy: user.name,
      },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    );

    return this.success(res, null, HttpStatus.OK, "E-statement sedang diproses. Akan dikirim ke email Anda.");
  });

  exportOutletReportExcel = this.handler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const query = exportOutletQuerySchema.parse(req.query);
    const ownerId = (req as any).storedUser?.id;

    const workbook = await this.reportService.exportOutletReportToExcel(
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

  exportStaffReportExcel = this.handler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const query = exportStaffQuerySchema.parse(req.query);
    const ownerId = (req as any).storedUser?.id;

    const workbook = await this.reportService.exportStaffReportToExcel(
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
}
