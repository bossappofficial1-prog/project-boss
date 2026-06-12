import { BaseService } from './base.service';
import { AdminSubscriptionRepository } from '../repositories/admin-subscription.repository';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditEntityType } from '@prisma/client';

export class AdminSubscriptionService extends BaseService {
  constructor(
    private adminSubscriptionRepository: AdminSubscriptionRepository,
    private auditLogService: AuditLogService,
  ) {
    super();
  }

  async getBusinessSubscription(businessId: string) {
    const data = await this.adminSubscriptionRepository.getBusinessSubscription(businessId);
    if (!data) this.notFound('Bisnis tidak ditemukan');
    return data;
  }

  async getAllPlans() {
    return this.adminSubscriptionRepository.getAllPlans();
  }

  async changePlan(businessId: string, planId: string, performedBy: string) {
    const business = await this.getBusinessSubscription(businessId);

    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await this.adminSubscriptionRepository.changeSubscriptionPlan(
      businessId,
      planId,
      now,
      endDate,
    );

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.SUBSCRIPTION_PLAN_CHANGED,
      AuditEntityType.BUSINESS,
      businessId,
      business.name,
      { newPlan: subscription.plan.code, newPlanName: subscription.plan.name },
    );

    return {
      message: `Plan bisnis "${business.name}" berhasil diubah ke ${subscription.plan.name}`,
      subscription,
    };
  }

  async extendSubscription(businessId: string, days: number, performedBy: string) {
    if (days <= 0) this.badRequest('Jumlah hari harus lebih dari 0');
    if (days > 365) this.badRequest('Maksimal perpanjangan 365 hari');

    const business = await this.getBusinessSubscription(businessId);
    const result = await this.adminSubscriptionRepository.extendSubscription(businessId, days);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.SUBSCRIPTION_EXTENDED,
      AuditEntityType.BUSINESS,
      businessId,
      business.name,
      { days, ...result },
    );

    return {
      message: `Langganan "${business.name}" diperpanjang ${days} hari`,
      ...result,
    };
  }

  async cancelSubscription(businessId: string, reason: string, performedBy: string) {
    if (!reason || reason.trim().length === 0) {
      this.badRequest('Alasan pembatalan wajib diisi');
    }

    const business = await this.getBusinessSubscription(businessId);
    await this.adminSubscriptionRepository.cancelSubscription(businessId, reason);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.SUBSCRIPTION_CANCELLED,
      AuditEntityType.BUSINESS,
      businessId,
      business.name,
      { reason },
    );

    return { message: `Langganan "${business.name}" berhasil dibatalkan` };
  }

  async markAsPaid(businessId: string, invoiceId: string, performedBy: string) {
    const business = await this.getBusinessSubscription(businessId);
    await this.adminSubscriptionRepository.markAsPaid(businessId, invoiceId, performedBy);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.INVOICE_VERIFIED,
      AuditEntityType.SUBSCRIPTION_INVOICE,
      invoiceId,
      business.name,
      { businessId, action: 'mark_as_paid' },
    );

    return { message: `Invoice berhasil ditandai sebagai lunas` };
  }
}
