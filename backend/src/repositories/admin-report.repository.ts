import { db } from '../config/prisma';
import { ReportType, ReportPeriod, ReportStatus, Prisma } from '@prisma/client';

export interface CreateAdminReportInput {
  type: ReportType;
  period: ReportPeriod;
  title: string;
  parameters?: Record<string, any>;
  generatedBy: string;
}

export interface AdminReportFilters {
  type?: ReportType;
  status?: ReportStatus;
  page?: number;
  limit?: number;
}

export class AdminReportRepository {
  async create(input: CreateAdminReportInput) {
    return db.report.create({
      data: {
        type: input.type,
        period: input.period,
        title: input.title,
        parameters: input.parameters as Prisma.InputJsonValue,
        generatedBy: input.generatedBy,
        status: ReportStatus.PENDING,
      },
      include: {
        generatedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findById(id: string) {
    return db.report.findUnique({
      where: { id },
      include: {
        generatedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateStatus(id: string, status: ReportStatus, data?: { fileUrl?: string; excelUrl?: string; fileSize?: number; errorMessage?: string }) {
    return db.report.update({
      where: { id },
      data: {
        status,
        ...(data?.fileUrl && { fileUrl: data.fileUrl }),
        ...(data?.excelUrl && { excelUrl: data.excelUrl }),
        ...(data?.fileSize && { fileSize: data.fileSize }),
        ...(data?.errorMessage && { errorMessage: data.errorMessage }),
      },
    });
  }

  async findAll(filters: AdminReportFilters) {
    const { type, status, page = 1, limit = 20 } = filters;
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const where: Prisma.ReportWhereInput = {
      ...(type && { type }),
      ...(status && { status }),
    };

    const [total, data] = await Promise.all([
      db.report.count({ where }),
      db.report.findMany({
        where,
        include: {
          generatedByUser: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      data,
      total,
      page: Math.max(page, 1),
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    };
  }

  async delete(id: string) {
    return db.report.delete({ where: { id } });
  }

  async getRevenueData(startDate: Date, endDate: Date) {
    const orders = await db.order.findMany({
      where: {
        orderStatus: 'COMPLETED',
        paymentStatus: 'SUCCESS',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    // Group by date (YYYY-MM-DD)
    const groupedByDate = new Map<string, { revenue: number; count: number }>();
    
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      const existing = groupedByDate.get(dateKey) || { revenue: 0, count: 0 };
      groupedByDate.set(dateKey, {
        revenue: existing.revenue + (order.totalAmount || 0),
        count: existing.count + 1,
      });
    }

    // Convert to array and sort by date
    const dailyBreakdown = Array.from(groupedByDate.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split(' ').reverse().join(' '));
        const dateB = new Date(b.date.split(' ').reverse().join(' '));
        return dateA.getTime() - dateB.getTime();
      });

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalTransactions = orders.length;
    const averagePerTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalTransactions,
      averagePerTransaction,
      dailyBreakdown,
    };
  }

  async getTransactionSummary(startDate: Date, endDate: Date) {
    const [total, successful, failed, refunded] = await Promise.all([
      db.order.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      db.order.count({
        where: { paymentStatus: 'SUCCESS', createdAt: { gte: startDate, lte: endDate } },
      }),
      db.order.count({
        where: { paymentStatus: 'FAILED', createdAt: { gte: startDate, lte: endDate } },
      }),
      db.order.count({
        where: { paymentStatus: 'REFUNDED', createdAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    return { total, successful, failed, refunded };
  }

  async getBusinessPerformance(startDate: Date, endDate: Date) {
    const businesses = await db.business.findMany({
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        owner: { select: { name: true, email: true } },
        outlets: {
          select: {
            id: true,
            name: true,
            orders: {
              where: {
                orderStatus: 'COMPLETED',
                paymentStatus: 'SUCCESS',
                createdAt: { gte: startDate, lte: endDate },
              },
              select: { totalAmount: true },
            },
          },
        },
      },
    });

    // Transform to flat structure expected by template
    return {
      businesses: businesses.map((business) => {
        const totalRevenue = business.outlets.reduce(
          (sum, outlet) => sum + outlet.orders.reduce((orderSum, order) => orderSum + (order.totalAmount || 0), 0),
          0
        );
        return {
          name: business.name,
          ownerName: business.owner?.name || '-',
          plan: business.subscriptionPlan,
          revenue: totalRevenue,
        };
      }),
    };
  }

  async getSubscriptionSummary() {
    const [active, trial, expired, suspended, cancelled] = await Promise.all([
      db.business.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      db.business.count({ where: { subscriptionStatus: 'TRIAL' } }),
      db.business.count({ where: { subscriptionStatus: 'EXPIRED' } }),
      db.business.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
      db.business.count({ where: { subscriptionStatus: 'CANCELLED' } }),
    ]);

    const planDistribution = await db.business.groupBy({
      by: ['subscriptionPlan'],
      _count: { id: true },
    });

    return {
      active,
      trial,
      expired,
      suspended,
      cancelled,
      planDistribution: planDistribution.map((item) => ({
        plan: item.subscriptionPlan,
        count: item._count.id,
      })),
    };
  }
}
