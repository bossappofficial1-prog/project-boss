import { db } from '../config/prisma';
import { Prisma } from '@prisma/client';

export interface PlatformSettingValue {
  platform: {
    name: string;
    version: string;
    maintenanceMode: boolean;
    logoUrl?: string;
  };
  fees: {
    appFeePercent: number;
    midtransFeePercent: number;
    minimumWithdrawal: number;
  };
  notifications: {
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
  limits: {
    maxBusinessesPerOwner: number;
    maxOutletsPerBusiness: number;
    maxProductsPerOutlet: number;
  };
}

export class PlatformSettingRepository {
  async get(key: string): Promise<any | null> {
    const setting = await db.platformSetting.findUnique({
      where: { key },
    });
    return setting?.value ?? null;
  }

  async set(key: string, value: any, updatedBy?: string) {
    return db.platformSetting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue, updatedBy },
      update: { value: value as Prisma.InputJsonValue, updatedBy },
    });
  }

  async getAll(): Promise<Record<string, any>> {
    const settings = await db.platformSetting.findMany();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
  }

  async getPlatformConfig(): Promise<PlatformSettingValue> {
    const defaults: PlatformSettingValue = {
      platform: {
        name: 'BOSS',
        version: '1.0.0',
        maintenanceMode: false,
      },
      fees: {
        appFeePercent: 2.5,
        midtransFeePercent: 1.5,
        minimumWithdrawal: 50000,
      },
      notifications: {
        whatsappEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
      },
      limits: {
        maxBusinessesPerOwner: 3,
        maxOutletsPerBusiness: 10,
        maxProductsPerOutlet: 500,
      },
    };

    const stored = await this.getAll();
    if (!stored || Object.keys(stored).length === 0) {
      return defaults;
    }

    return {
      platform: { ...defaults.platform, ...(stored.platform as object) },
      fees: { ...defaults.fees, ...(stored.fees as object) },
      notifications: { ...defaults.notifications, ...(stored.notifications as object) },
      limits: { ...defaults.limits, ...(stored.limits as object) },
    };
  }

  async updatePlatformConfig(config: Partial<PlatformSettingValue>, updatedBy?: string) {
    const current = await this.getPlatformConfig();
    
    const updated: PlatformSettingValue = {
      platform: { ...current.platform, ...config.platform },
      fees: { ...current.fees, ...config.fees },
      notifications: { ...current.notifications, ...config.notifications },
      limits: { ...current.limits, ...config.limits },
    };

    await this.set('platform_config', updated, updatedBy);
    return updated;
  }
}
