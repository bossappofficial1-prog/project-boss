import { db } from '../config/prisma';
import { ReportType, ReportPeriod, ReportStatus, Prisma } from '@prisma/client';

export interface CreateReportInput {
  type: ReportType;
  period: ReportPeriod;
  title: string;
  parameters?: Record<string, any>;
  generatedBy: string;
}

export interface ReportFilters {
  type?: ReportType;
  status?: ReportStatus;
  page?: number;
  limit?: number;
}

export class ReportRepository {
  async create(input: CreateReportInput) {
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

  async updateStatus(id: string, status: ReportStatus, data?: { fileUrl?: string; fileSize?: number; errorMessage?: string }) {
    return db.report.update({
      where: { id },
      data: {
        status,
        ...(data?.fileUrl && { fileUrl: data.fileUrl }),
        ...(data?.fileSize && { fileSize: data.fileSize }),
        ...(data?.errorMessage && { errorMessage: data.errorMessage }),
      },
    });
  }

  async findAll(filters: ReportFilters) {
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
    const orders = await db.order.groupBy({
      by: ['createdAt'],
      where: {
        paymentStatus: 'SUCCESS',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return orders;
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
    return db.business.findMany({
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
                paymentStatus: 'SUCCESS',
                createdAt: { gte: startDate, lte: endDate },
              },
              select: { totalAmount: true },
            },
          },
        },
      },
    });
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
