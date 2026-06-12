import { BaseService } from './base.service';
import { db } from '../config/prisma';
import { EmailService } from './email.service';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditEntityType } from '@prisma/client';

export interface SendNotificationInput {
  businessId: string;
  subject: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  channels: ('in_app' | 'email')[];
}

export interface BroadcastNotificationInput {
  subject: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  channels: ('in_app' | 'email')[];
  filter?: {
    subscriptionStatus?: string[];
    subscriptionPlan?: string[];
  };
}

export class AdminNotificationService extends BaseService {
  constructor(
    private auditLogService: AuditLogService,
  ) {
    super();
  }

  async sendToBusiness(input: SendNotificationInput, performedBy: string) {
    const business = await db.business.findUnique({
      where: { id: input.businessId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!business) this.notFound('Bisnis tidak ditemukan');

    const results: { channel: string; success: boolean; error?: string }[] = [];

    // Send email
    if (input.channels.includes('email') && business.owner.email) {
      try {
        await EmailService.sendEmail({
          to: business.owner.email,
          subject: `[BOSS Platform] ${input.subject}`,
          html: this.buildEmailHtml(business.owner.name, input.subject, input.message, input.type),
          text: `${input.subject}\n\n${input.message}`,
        });
        results.push({ channel: 'email', success: true });
      } catch (error: any) {
        results.push({ channel: 'email', success: false, error: error.message });
      }
    }

    // In-app notification (store as platform setting for now, or could be a dedicated table)
    if (input.channels.includes('in_app')) {
      try {
        const notificationKey = `notification_${business.id}_${Date.now()}`;
        await db.platformSetting.create({
          data: {
            key: notificationKey,
            value: {
              type: 'business_notification',
              businessId: business.id,
              ownerId: business.owner.id,
              subject: input.subject,
              message: input.message,
              notificationType: input.type,
              read: false,
              createdAt: new Date().toISOString(),
            },
            updatedBy: performedBy,
          },
        });
        results.push({ channel: 'in_app', success: true });
      } catch (error: any) {
        results.push({ channel: 'in_app', success: false, error: error.message });
      }
    }

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.NOTIFICATION_SENT,
      AuditEntityType.BUSINESS,
      input.businessId,
      business.name,
      { subject: input.subject, channels: input.channels, results },
    );

    return {
      message: `Notifikasi terkirim ke "${business.name}"`,
      results,
    };
  }

  async broadcast(input: BroadcastNotificationInput, performedBy: string) {
    const where: any = {};
    if (input.filter?.subscriptionStatus?.length) {
      where.subscriptionStatus = { in: input.filter.subscriptionStatus };
    }
    if (input.filter?.subscriptionPlan?.length) {
      where.subscriptionPlan = { in: input.filter.subscriptionPlan };
    }

    const businesses = await db.business.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (businesses.length === 0) {
      return { message: 'Tidak ada bisnis yang memenuhi filter', sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const business of businesses) {
      try {
        await this.sendToBusiness(
          {
            businessId: business.id,
            subject: input.subject,
            message: input.message,
            type: input.type,
            channels: input.channels,
          },
          performedBy,
        );
        sent++;
      } catch {
        failed++;
      }
    }

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.NOTIFICATION_SENT,
      AuditEntityType.BUSINESS,
      'broadcast',
      `Broadcast ke ${businesses.length} bisnis`,
      { subject: input.subject, sent, failed, filter: input.filter },
    );

    return {
      message: `Broadcast selesai: ${sent} terkirim, ${failed} gagal`,
      sent,
      failed,
      total: businesses.length,
    };
  }

  async getBusinessNotifications(businessId: string) {
    const notifications = await db.platformSetting.findMany({
      where: {
        key: { startsWith: `notification_${businessId}_` },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return notifications.map((n) => ({
      id: n.id,
      ...(n.value as any),
    }));
  }

  private buildEmailHtml(ownerName: string, subject: string, message: string, type: string): string {
    const typeColors: Record<string, string> = {
      info: '#2563eb',
      warning: '#d97706',
      success: '#16a34a',
      error: '#dc2626',
    };
    const color = typeColors[type] || '#2563eb';

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: ${color}; padding: 24px;">
            <h1 style="color: white; margin: 0; font-size: 20px;">BOSS Platform</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #334155; font-size: 14px;">Halo <strong>${ownerName}</strong>,</p>
            <h2 style="color: #0f172a; font-size: 18px; margin: 16px 0;">${subject}</h2>
            <div style="color: #475569; font-size: 14px; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 12px;">
              Pesan ini dikirim oleh admin BOSS Platform. Silakan hubungi support jika ada pertanyaan.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
