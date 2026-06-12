import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { AdminReportService } from "../service/admin-report.service";
import { HttpStatus } from "../constants/http-status";

export class AdminReportController extends BaseController {
  constructor(private adminReportService: AdminReportService) {
    super();
  }

  generate = this.handler(async (req: Request, res: Response) => {
    const { type, period, startDate, endDate } = req.body;
    const performedBy = (req as any).storedUser?.id;

    if (!performedBy) {
      return this.error(res, "User not authenticated", [], HttpStatus.UNAUTHORIZED);
    }

    const report = await this.adminReportService.generateReport(
      type,
      period,
      performedBy,
      startDate && endDate ? { startDate, endDate } : undefined,
    );

    return this.success(
      res,
      report,
      HttpStatus.CREATED,
      "Laporan sedang diproses",
    );
  });

  getAll = this.handler(async (req: Request, res: Response) => {
    const { type, status, page, limit } = req.query;

    const result = await this.adminReportService.getAll({
      type: type as any,
      status: status as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return this.paginated(
      res,
      result.data,
      result.page,
      result.limit,
      result.total,
      { totalPages: result.totalPages },
    );
  });

  getById = this.handler(async (req: Request, res: Response) => {
    const reportId = req.params.reportId as string;

    const report = await this.adminReportService.getById(reportId);

    return this.success(res, report);
  });

  delete = this.handler(async (req: Request, res: Response) => {
    const reportId = req.params.reportId as string;
    const performedBy = (req as any).storedUser?.id;

    if (!performedBy) {
      return this.error(res, "User not authenticated", [], HttpStatus.UNAUTHORIZED);
    }

    const result = await this.adminReportService.delete(
      reportId,
      performedBy,
    );

    return this.success(res, result);
  });
}
