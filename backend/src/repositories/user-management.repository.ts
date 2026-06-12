import { db } from '../config/prisma';
import { UserStatus, Prisma } from '@prisma/client';

export interface UserManagementFilters {
  search?: string;
  role?: string;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export class UserManagementRepository {
  async findById(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            subscriptionEndDate: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
    });
  }

  async updateStatus(id: string, status: UserStatus) {
    return db.user.update({
      where: { id },
      data: { status },
    });
  }

  async findAll(filters: UserManagementFilters) {
    const { search, role, status, page = 1, limit = 20 } = filters;
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const where: Prisma.UserWhereInput = {
      ...(role && { role: role as any }),
      ...(status && { status }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          isVerified: true,
          phone: true,
          provider: true,
          createdAt: true,
          updatedAt: true,
          business: {
            select: {
              id: true,
              name: true,
              subscriptionPlan: true,
              subscriptionStatus: true,
            },
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
    return db.user.delete({ where: { id } });
  }

  async getStats() {
    const [total, active, suspended, inactive] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: 'ACTIVE' } }),
      db.user.count({ where: { status: 'SUSPENDED' } }),
      db.user.count({ where: { status: 'INACTIVE' } }),
    ]);

    return { total, active, suspended, inactive };
  }
}
