import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { UserManagementService } from '../service/user-management.service';
import { HttpStatus } from '../constants/http-status';

export class UserManagementController extends BaseController {
  constructor(private userManagementService: UserManagementService) {
    super();
  }

  getAll = this.handler(async (req: Request, res: Response) => {
    const { search, role, status, page, limit } = req.query;

    const result = await this.userManagementService.getAll({
      search: search as string,
      role: role as string,
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
    const userId = req.params.userId as string;

    const user = await this.userManagementService.getById(userId);

    return this.success(res, user);
  });

  suspend = this.handler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const { reason } = req.body;
    const performedBy = (req as any).user?.id;
    const ipAddress = req.ip;

    const result = await this.userManagementService.suspendUser(userId, performedBy, reason, ipAddress);

    return this.success(res, result);
  });

  reactivate = this.handler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const performedBy = (req as any).user?.id;
    const ipAddress = req.ip;

    const result = await this.userManagementService.reactivateUser(userId, performedBy, ipAddress);

    return this.success(res, result);
  });

  delete = this.handler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const performedBy = (req as any).user?.id;
    const ipAddress = req.ip;

    const result = await this.userManagementService.deleteUser(userId, performedBy, ipAddress);

    return this.success(res, result);
  });

  bulkSuspend = this.handler(async (req: Request, res: Response) => {
    const { userIds, reason } = req.body;
    const performedBy = (req as any).user?.id;
    const ipAddress = req.ip;

    const result = await this.userManagementService.bulkSuspend(userIds, performedBy, reason, ipAddress);

    return this.success(res, result);
  });

  bulkReactivate = this.handler(async (req: Request, res: Response) => {
    const { userIds } = req.body;
    const performedBy = (req as any).user?.id;
    const ipAddress = req.ip;

    const result = await this.userManagementService.bulkReactivate(userIds, performedBy, ipAddress);

    return this.success(res, result);
  });

  getStats = this.handler(async (req: Request, res: Response) => {
    const stats = await this.userManagementService.getStats();

    return this.success(res, stats);
  });
}
