import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { PlatformSettingService } from '../service/platform-setting.service';
import { HttpStatus } from '../constants/http-status';

export class PlatformSettingController extends BaseController {
  constructor(private platformSettingService: PlatformSettingService) {
    super();
  }

  getSettings = this.handler(async (req: Request, res: Response) => {
    const settings = await this.platformSettingService.getSettings();

    return this.success(res, settings);
  });

  updateSettings = this.handler(async (req: Request, res: Response) => {
    const performedBy = (req as any).user?.id;

    const updated = await this.platformSettingService.updateSettings(req.body, performedBy);

    return this.success(res, updated, HttpStatus.OK, 'Settings berhasil diupdate');
  });

  getSettingByKey = this.handler(async (req: Request, res: Response) => {
    const key = req.params.key as string;

    const value = await this.platformSettingService.getSettingByKey(key);

    if (value === null) {
      return this.error(res, 'Setting tidak ditemukan', [], HttpStatus.NOT_FOUND);
    }

    return this.success(res, { key, value });
  });

  setSetting = this.handler(async (req: Request, res: Response) => {
    const key = req.params.key as string;
    const { value } = req.body;
    const performedBy = (req as any).user?.id;

    const result = await this.platformSettingService.setSetting(key, value, performedBy);

    return this.success(res, result);
  });
}
