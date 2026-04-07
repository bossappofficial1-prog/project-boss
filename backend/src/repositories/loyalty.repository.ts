import { db } from "../config/prisma";

export class LoyaltyRepository {
  static async getLoyaltyConfig(outletId: string) {
    return db.loyaltyConfig.findUnique({
      where: { outletId },
    });
  }

  static async upsertLoyaltyConfig(outletId: string, data: {
    pointsEarned: number;
    multiplierAmount: number;
    minSpending: number;
    pointValue: number;
    isActive: boolean;
  }) {
    return db.loyaltyConfig.upsert({
      where: { outletId },
      update: data,
      create: { ...data, outletId },
    });
  }

  static async getMembership(guestCustomerId: string, outletId: string) {
    return db.outletMembership.findUnique({
      where: {
        guestCustomerId_outletId: {
          guestCustomerId,
          outletId,
        },
      },
      include: {
        guestCustomer: true,
      },
    });
  }

  static async createMembership(guestCustomerId: string, outletId: string) {
    return db.outletMembership.create({
      data: {
        guestCustomerId,
        outletId,
        status: "ACTIVE",
      },
    });
  }

  static async addPoints(guestCustomerId: string, outletId: string, points: number) {
    return db.outletMembership.update({
      where: {
        guestCustomerId_outletId: {
          guestCustomerId,
          outletId,
        },
      },
      data: {
        totalPoints: {
          increment: points,
        },
      },
    });
  }

  static async addPointsAndSpending(guestCustomerId: string, outletId: string, points: number, spending: number) {
    return db.outletMembership.update({
      where: {
        guestCustomerId_outletId: {
          guestCustomerId,
          outletId,
        },
      },
      data: {
        totalPoints: {
          increment: points,
        },
        totalSpending: {
          increment: spending,
        },
      },
    });
  }

  static async deductPoints(guestCustomerId: string, outletId: string, points: number) {
    return db.outletMembership.update({
      where: {
        guestCustomerId_outletId: {
          guestCustomerId,
          outletId,
        },
      },
      data: {
        totalPoints: {
          decrement: points,
        },
      },
    });
  }

  static async findMembersByOutlet(outletId: string, search?: string, skip = 0, take = 20) {
    return db.outletMembership.findMany({
      where: {
        outletId,
        guestCustomer: search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ]
        } : undefined,
      },
      include: {
        guestCustomer: true,
      },
      skip,
      take,
      orderBy: {
        joinedAt: 'desc',
      },
    });
  }

  static async countMembersByOutlet(outletId: string, search?: string) {
    return db.outletMembership.count({
      where: {
        outletId,
        guestCustomer: search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ]
        } : undefined,
      },
    });
  }
}
