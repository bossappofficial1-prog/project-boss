import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { BusinessManagementService } from '../service/business-management.service';
import { HttpStatus } from '../constants/http-status';

export class BusinessManagementController extends BaseController {
  constructor(private businessManagementService: BusinessManagementService) {
    super();
  }

  getDetails = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const business = await this.businessManagementService.getDetails(businessId);
    return this.success(res, business);
  });

  updateBusiness = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const performedBy = (req as any).storedUser?.id;
    if (!performedBy) return this.error(res, 'Unauthorized', [], HttpStatus.UNAUTHORIZED);

    const result = await this.businessManagementService.updateBusiness(businessId, req.body, performedBy);
    return this.success(res, result);
  });

  getSettings = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const settings = await this.businessManagementService.getSettings(businessId);
    return this.success(res, settings);
  });

  updateSettings = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const performedBy = (req as any).storedUser?.id;
    if (!performedBy) return this.error(res, 'Unauthorized', [], HttpStatus.UNAUTHORIZED);

    const result = await this.businessManagementService.updateSettings(businessId, req.body, performedBy);
    return this.success(res, result);
  });

  getHealthScore = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const healthScore = await this.businessManagementService.getHealthScore(businessId);
    return this.success(res, healthScore);
  });

  getRecentActivity = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const activities = await this.businessManagementService.getRecentActivity(businessId, limit);
    return this.success(res, activities);
  });
}
