import { db } from '../config/prisma';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';

export interface CreateAuditLogInput {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  performedBy: string;
}

export interface AuditLogFilters {
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  performedBy?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export class AuditLogRepository {
  async create(input: CreateAuditLogInput) {
    return db.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        entityName: input.entityName,
        details: input.details as Prisma.InputJsonValue,
        ipAddress: input.ipAddress,
        performedBy: input.performedBy,
      },
      include: {
        performedByUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async findAll(filters: AuditLogFilters) {
    const { action, entityType, entityId, performedBy, startDate, endDate, search, page = 1, limit = 20 } = filters;
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const where: Prisma.AuditLogWhereInput = {
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(performedBy && { performedBy }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { entityName: { contains: search, mode: 'insensitive' } },
              { performedByUser: { name: { contains: search, mode: 'insensitive' } } },
              { performedByUser: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        include: {
          performedByUser: {
            select: { id: true, name: true, email: true, role: true },
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

  async findByEntity(entityType: AuditEntityType, entityId: string) {
    return db.auditLog.findMany({
      where: { entityType, entityId },
      include: {
        performedByUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const [total, todayCount, actionDistribution] = await Promise.all([
      db.auditLog.count(),
      db.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.auditLog.groupBy({
        by: ['action'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      todayCount,
      actionDistribution: actionDistribution.map((item) => ({
        action: item.action,
        count: item._count.id,
      })),
    };
  }
}
