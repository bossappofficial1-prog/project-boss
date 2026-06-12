import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { AdminNotificationService } from '../service/admin-notification.service';
import { HttpStatus } from '../constants/http-status';

export class AdminNotificationController extends BaseController {
  constructor(private adminNotificationService: AdminNotificationService) {
    super();
  }

  sendToBusiness = this.handler(async (req: Request, res: Response) => {
    const { businessId, subject, message, type, channels } = req.body;
    const performedBy = (req as any).storedUser?.id;
    if (!performedBy) return this.error(res, 'Unauthorized', [], HttpStatus.UNAUTHORIZED);

    const result = await this.adminNotificationService.sendToBusiness(
      { businessId, subject, message, type, channels },
      performedBy,
    );

    return this.success(res, result);
  });

  broadcast = this.handler(async (req: Request, res: Response) => {
    const { subject, message, type, channels, filter } = req.body;
    const performedBy = (req as any).storedUser?.id;
    if (!performedBy) return this.error(res, 'Unauthorized', [], HttpStatus.UNAUTHORIZED);

    const result = await this.adminNotificationService.broadcast(
      { subject, message, type, channels, filter },
      performedBy,
    );

    return this.success(res, result);
  });

  getBusinessNotifications = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const notifications = await this.adminNotificationService.getBusinessNotifications(businessId);
    return this.success(res, notifications);
  });
}
