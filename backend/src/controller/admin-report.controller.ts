import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { ReportService } from "../service/report.service";
import { HttpStatus } from "../constants/http-status";

export class ReportController extends BaseController {
  constructor(private reportService: ReportService) {
    super();
  }

  generate = this.handler(async (req: Request, res: Response) => {
    const { type, period, startDate, endDate } = req.body;
    const performedBy = (req as any).user?.id;

    const report = await this.reportService.generateReport(
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

    const result = await this.reportService.getAll({
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
    const { reportId } = req.params;

    const report = await this.reportService.getById(reportId as string);

    return this.success(res, report);
  });

  delete = this.handler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const performedBy = (req as any).user?.id;

    const result = await this.reportService.delete(
      reportId as string,
      performedBy,
    );

    return this.success(res, result);
  });
}
