import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { AdminSubscriptionService } from '../service/admin-subscription.service';
import { HttpStatus } from '../constants/http-status';

export class AdminSubscriptionController extends BaseController {
  constructor(private adminSubscriptionService: AdminSubscriptionService) {
    super();
  }

  getBusinessSubscription = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const data = await this.adminSubscriptionService.getBusinessSubscription(businessId);
    return this.success(res, data);
  });

  getAllPlans = this.handler(async (_req: Request, res: Response) => {
    const plans = await this.adminSubscriptionService.getAllPlans();
    return this.success(res, plans);
  });

  changePlan = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const { planId } = req.body;
    const performedBy = (req as any).storedUser?.id;
    if (!performedBy) return this.error(res, 'Unauthorized', [], HttpStatus.UNAUTHORIZED);

    const result = await this.adminSubscriptionService.changePlan(businessId, planId, performedBy);
    return this.success(res, result);
  });

  extendSubscription = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const { days } = req.body;
    const performedBy = (req as any).storedUser?.id;
    if (!performedBy) return this.error(res, 'Unauthorized', [], HttpStatus.UNAUTHORIZED);

    const result = await this.adminSubscriptionService.extendSubscription(businessId, days, performedBy);
    return this.success(res, result);
  });

  cancelSubscription = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const { reason } = req.body;
    const performedBy = (req as any).storedUser?.id;
    if (!performedBy) return this.error(res, 'Unauthorized', [], HttpStatus.UNAUTHORIZED);

    const result = await this.adminSubscriptionService.cancelSubscription(businessId, reason, performedBy);
    return this.success(res, result);
  });

  markAsPaid = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const { invoiceId } = req.body;
    const performedBy = (req as any).storedUser?.id;
    if (!performedBy) return this.error(res, 'Unauthorized', [], HttpStatus.UNAUTHORIZED);

    const result = await this.adminSubscriptionService.markAsPaid(businessId, invoiceId, performedBy);
    return this.success(res, result);
  });
}
