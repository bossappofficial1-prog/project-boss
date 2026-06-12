import { BaseService } from './base.service';
import {
  BusinessManagementRepository,
  BusinessUpdateInput,
  BusinessSettingsInput,
  BusinessHealthScore,
} from '../repositories/business-management.repository';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditEntityType } from '@prisma/client';

export class BusinessManagementService extends BaseService {
  constructor(
    private businessManagementRepository: BusinessManagementRepository,
    private auditLogService: AuditLogService,
  ) {
    super();
  }

  async getDetails(businessId: string) {
    const business = await this.businessManagementRepository.findById(businessId);
    if (!business) this.notFound('Bisnis tidak ditemukan');
    return business;
  }

  async updateBusiness(businessId: string, data: BusinessUpdateInput, performedBy: string) {
    const business = await this.getDetails(businessId);

    const updated = await this.businessManagementRepository.update(businessId, data);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.BUSINESS_UPDATED,
      AuditEntityType.BUSINESS,
      businessId,
      business.name,
      { changes: data },
    );

    return {
      message: `Bisnis "${business.name}" berhasil diupdate`,
      business: updated,
    };
  }

  async getSettings(businessId: string) {
    await this.getDetails(businessId);
    const settings = await this.businessManagementRepository.getSettings(businessId);
    return settings || {
      customOutletLimit: null,
      customProductLimit: null,
      customStaffLimit: null,
      featureFlags: {},
      notes: '',
    };
  }

  async updateSettings(businessId: string, settings: BusinessSettingsInput, performedBy: string) {
    const business = await this.getDetails(businessId);
    await this.businessManagementRepository.updateSettings(businessId, settings, performedBy);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.SETTINGS_UPDATED,
      AuditEntityType.BUSINESS,
      businessId,
      business.name,
      { settings },
    );

    return { message: `Pengaturan bisnis "${business.name}" berhasil diupdate` };
  }

  async getHealthScore(businessId: string): Promise<BusinessHealthScore> {
    const stats = await this.businessManagementRepository.getBusinessStats(businessId);
    if (!stats) this.notFound('Bisnis tidak ditemukan');

    const { business, revenue30d, orders30d, outlets, products, staff } = stats;

    // 1. Subscription Score (max 30)
    let subScore = 0;
    let subDetail = '';
    if (business.subscriptionStatus === 'ACTIVE') {
      subScore = 30;
      subDetail = 'Langganan aktif';
    } else if (business.subscriptionStatus === 'TRIAL') {
      subScore = 20;
      subDetail = 'Masa trial';
    } else if (business.subscriptionStatus === 'PAST_DUE') {
      subScore = 10;
      subDetail = 'Pembayaran terlambat';
    } else if (business.subscriptionStatus === 'SUSPENDED') {
      subScore = 0;
      subDetail = 'Bisnis disuspend';
    } else if (business.subscriptionStatus === 'EXPIRED') {
      subScore = 0;
      subDetail = 'Langganan kadaluarsa';
    } else {
      subScore = 5;
      subDetail = `Status: ${business.subscriptionStatus}`;
    }

    // 2. Activity Score (max 25) - based on orders in last 30 days
    let actScore = 0;
    let actDetail = '';
    if (orders30d >= 100) {
      actScore = 25;
      actDetail = `${orders30d} order (sangat aktif)`;
    } else if (orders30d >= 50) {
      actScore = 20;
      actDetail = `${orders30d} order (aktif)`;
    } else if (orders30d >= 10) {
      actScore = 15;
      actDetail = `${orders30d} order (cukup aktif)`;
    } else if (orders30d >= 1) {
      actScore = 8;
      actDetail = `${orders30d} order (kurang aktif)`;
    } else {
      actScore = 0;
      actDetail = 'Tidak ada order';
    }

    // 3. Revenue Score (max 25) - based on 30-day revenue
    let revScore = 0;
    let revDetail = '';
    if (revenue30d >= 10000000) {
      revScore = 25;
      revDetail = `Rp ${(revenue30d / 1000000).toFixed(1)}jt (excellent)`;
    } else if (revenue30d >= 5000000) {
      revScore = 20;
      revDetail = `Rp ${(revenue30d / 1000000).toFixed(1)}jt (good)`;
    } else if (revenue30d >= 1000000) {
      revScore = 15;
      revDetail = `Rp ${(revenue30d / 1000000).toFixed(1)}jt (fair)`;
    } else if (revenue30d >= 100000) {
      revScore = 8;
      revDetail = `Rp ${(revenue30d / 1000).toFixed(0)}rb (low)`;
    } else if (revenue30d > 0) {
      revScore = 3;
      revDetail = `Rp ${revenue30d} (minimal)`;
    } else {
      revScore = 0;
      revDetail = 'Tidak ada pendapatan';
    }

    // 4. Outlet/Setup Score (max 20)
    let outScore = 0;
    let outDetail = '';
    if (outlets >= 3 && products >= 20 && staff >= 5) {
      outScore = 20;
      outDetail = `${outlets} outlet, ${products} produk, ${staff} staff`;
    } else if (outlets >= 1 && products >= 5 && staff >= 2) {
      outScore = 15;
      outDetail = `${outlets} outlet, ${products} produk, ${staff} staff`;
    } else if (outlets >= 1 && products >= 1) {
      outScore = 10;
      outDetail = `${outlets} outlet, ${products} produk`;
    } else if (outlets >= 1) {
      outScore = 5;
      outDetail = `${outlets} outlet (belum lengkap)`;
    } else {
      outScore = 0;
      outDetail = 'Belum ada outlet';
    }

    const totalScore = subScore + actScore + revScore + outScore;

    let level: BusinessHealthScore['level'];
    if (totalScore >= 85) level = 'excellent';
    else if (totalScore >= 65) level = 'good';
    else if (totalScore >= 45) level = 'fair';
    else if (totalScore >= 25) level = 'poor';
    else level = 'critical';

    return {
      score: totalScore,
      breakdown: {
        subscription: { score: subScore, max: 30, detail: subDetail },
        activity: { score: actScore, max: 25, detail: actDetail },
        revenue: { score: revScore, max: 25, detail: revDetail },
        outlets: { score: outScore, max: 20, detail: outDetail },
      },
      level,
    };
  }

  async getRecentActivity(businessId: string, limit = 20) {
    await this.getDetails(businessId);
    return this.businessManagementRepository.getRecentActivity(businessId, limit);
  }
}
