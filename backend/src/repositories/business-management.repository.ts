import { db } from '../config/prisma';
import { Prisma } from '@prisma/client';

export interface BusinessUpdateInput {
  name?: string;
  description?: string;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
}

export interface BusinessSettingsInput {
  customOutletLimit?: number;
  customProductLimit?: number;
  customStaffLimit?: number;
  featureFlags?: Record<string, boolean>;
  notes?: string;
}

export interface BusinessHealthScore {
  score: number;
  breakdown: {
    subscription: { score: number; max: number; detail: string };
    activity: { score: number; max: number; detail: string };
    revenue: { score: number; max: number; detail: string };
    outlets: { score: number; max: number; detail: string };
  };
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export class BusinessManagementRepository {
  async findById(id: string) {
    return db.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true, isVerified: true, avatar: true, status: true },
        },
        outlets: {
          select: {
            id: true, name: true, address: true, isOpen: true, type: true,
            _count: { select: { orders: true, products: true, staff: true } },
          },
        },
        currentSubscription: {
          include: { plan: true },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { plan: true },
        },
        subscriptionInvoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { outlets: true, subscriptions: true, subscriptionInvoices: true },
        },
      },
    });
  }

  async update(id: string, data: BusinessUpdateInput) {
    return db.business.update({
      where: { id },
      data,
    });
  }

  async getSettings(businessId: string) {
    const setting = await db.platformSetting.findUnique({
      where: { key: `business_settings_${businessId}` },
    });
    return (setting?.value as any) || null;
  }

  async updateSettings(businessId: string, settings: BusinessSettingsInput, updatedBy: string) {
    return db.platformSetting.upsert({
      where: { key: `business_settings_${businessId}` },
      create: {
        key: `business_settings_${businessId}`,
        value: settings as any,
        updatedBy,
      },
      update: {
        value: settings as any,
        updatedBy,
      },
    });
  }

  async getBusinessStats(businessId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: {
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        createdAt: true,
      },
    });

    if (!business) return null;

    // Get revenue for last 30 days
    const outlets = await db.outlet.findMany({
      where: { businessId },
      select: { id: true },
    });
    const outletIds = outlets.map((o) => o.id);

    const [orders30d, orders90d, products, staff] = await Promise.all([
      outletIds.length > 0
        ? db.order.aggregate({
            where: {
              outletId: { in: outletIds },
              paymentStatus: 'SUCCESS',
              createdAt: { gte: thirtyDaysAgo },
            },
            _sum: { totalAmount: true },
            _count: true,
          })
        : Promise.resolve({ _sum: { totalAmount: 0 }, _count: 0 }),
      outletIds.length > 0
        ? db.order.aggregate({
            where: {
              outletId: { in: outletIds },
              paymentStatus: 'SUCCESS',
              createdAt: { gte: ninetyDaysAgo },
            },
            _sum: { totalAmount: true },
            _count: true,
          })
        : Promise.resolve({ _sum: { totalAmount: 0 }, _count: 0 }),
      outletIds.length > 0
        ? db.product.count({ where: { outletId: { in: outletIds } } })
        : Promise.resolve(0),
      outletIds.length > 0
        ? db.staff.count({ where: { outletId: { in: outletIds } } })
        : Promise.resolve(0),
    ]);

    return {
      business,
      outlets: outlets.length,
      products,
      staff,
      revenue30d: Number(orders30d._sum.totalAmount) || 0,
      orders30d: orders30d._count,
      revenue90d: Number(orders90d._sum.totalAmount) || 0,
      orders90d: orders90d._count,
    };
  }

  async getRecentActivity(businessId: string, limit = 20) {
    const outlets = await db.outlet.findMany({
      where: { businessId },
      select: { id: true },
    });
    const outletIds = outlets.map((o) => o.id);

    if (outletIds.length === 0) return [];

    const [recentOrders, recentInvoices] = await Promise.all([
      db.order.findMany({
        where: { outletId: { in: outletIds } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          totalAmount: true,
          orderStatus: true,
          paymentStatus: true,
          createdAt: true,
          outlet: { select: { name: true } },
        },
      }),
      db.subscriptionInvoice.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Merge and sort by date
    const activities: Array<{
      type: 'order' | 'invoice';
      date: Date;
      data: any;
    }> = [
      ...recentOrders.map((o) => ({ type: 'order' as const, date: o.createdAt, data: o })),
      ...recentInvoices.map((i) => ({ type: 'invoice' as const, date: i.createdAt, data: i })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);

    return activities;
  }
}
