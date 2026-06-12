import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { AuditLogService } from '../service/audit-log.service';
import { HttpStatus } from '../constants/http-status';

export class AuditLogController extends BaseController {
  constructor(private auditLogService: AuditLogService) {
    super();
  }

  getAll = this.handler(async (req: Request, res: Response) => {
    const { action, entityType, entityId, performedBy, startDate, endDate, search, page, limit } = req.query;

    const result = await this.auditLogService.getAll({
      action: action as any,
      entityType: entityType as any,
      entityId: entityId as string,
      performedBy: performedBy as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
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

  getByEntity = this.handler(async (req: Request, res: Response) => {
    const entityType = req.params.entityType as string;
    const entityId = req.params.entityId as string;

    const logs = await this.auditLogService.getByEntity(entityType as any, entityId);

    return this.success(res, logs);
  });

  getStats = this.handler(async (req: Request, res: Response) => {
    const stats = await this.auditLogService.getStats();

    return this.success(res, stats);
  });
}
