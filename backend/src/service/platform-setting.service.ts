import { BaseService } from './base.service';
import { PlatformSettingRepository, PlatformSettingValue } from '../repositories/platform-setting.repository';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditEntityType } from '@prisma/client';

export class PlatformSettingService extends BaseService {
  constructor(
    private platformSettingRepository: PlatformSettingRepository,
    private auditLogService: AuditLogService,
  ) {
    super();
  }

  async getSettings() {
    return this.platformSettingRepository.getPlatformConfig();
  }

  async updateSettings(config: Partial<PlatformSettingValue>, performedBy: string) {
    // Validate settings
    if (config.fees) {
      if (config.fees.appFeePercent !== undefined && (config.fees.appFeePercent < 0 || config.fees.appFeePercent > 100)) {
        this.badRequest('App fee percent harus antara 0-100');
      }
      if (config.fees.minimumWithdrawal !== undefined && config.fees.minimumWithdrawal < 0) {
        this.badRequest('Minimum withdrawal tidak boleh negatif');
      }
    }

    if (config.limits) {
      if (config.limits.maxBusinessesPerOwner !== undefined && config.limits.maxBusinessesPerOwner < 1) {
        this.badRequest('Max businesses per owner minimal 1');
      }
      if (config.limits.maxOutletsPerBusiness !== undefined && config.limits.maxOutletsPerBusiness < 1) {
        this.badRequest('Max outlets per business minimal 1');
      }
    }

    const updated = await this.platformSettingRepository.updatePlatformConfig(config, performedBy);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.SETTINGS_UPDATED,
      AuditEntityType.SETTINGS,
      'platform_config',
      'Platform Settings',
      { changes: config },
    );

    return updated;
  }

  async getSettingByKey(key: string) {
    return this.platformSettingRepository.get(key);
  }

  async setSetting(key: string, value: any, performedBy: string) {
    await this.platformSettingRepository.set(key, value, performedBy);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.SETTINGS_UPDATED,
      AuditEntityType.SETTINGS,
      key,
      `Setting: ${key}`,
      { value },
    );

    return { message: `Setting ${key} berhasil diupdate` };
  }
}
