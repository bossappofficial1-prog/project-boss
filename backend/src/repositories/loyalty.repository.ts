import { db } from "../config/prisma";
import { LoyaltyPointHistoryType } from "@prisma/client";

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

  static async addPointsAndSpendingWithHistory(
    guestCustomerId: string,
    outletId: string,
    points: number,
    spending: number,
    options?: { orderId?: string; note?: string },
  ) {
    return db.$transaction(async (tx) => {
      const membership = await tx.outletMembership.update({
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

      if (points > 0) {
        await tx.loyaltyPointHistory.create({
          data: {
            outletId,
            guestCustomerId,
            orderId: options?.orderId,
            type: LoyaltyPointHistoryType.EARN,
            points,
            note: options?.note,
          },
        });
      }

      return membership;
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

  static async adjustPointsWithHistory(
    guestCustomerId: string,
    outletId: string,
    points: number,
    note?: string,
  ) {
    return db.$transaction(async (tx) => {
      const membership = await tx.outletMembership.update({
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

      await tx.loyaltyPointHistory.create({
        data: {
          outletId,
          guestCustomerId,
          type: points >= 0 ? LoyaltyPointHistoryType.ADJUSTMENT_IN : LoyaltyPointHistoryType.ADJUSTMENT_OUT,
          points: Math.abs(points),
          note,
        },
      });

      return membership;
    });
  }

  static async deductPointsWithHistory(
    guestCustomerId: string,
    outletId: string,
    points: number,
    options?: { orderId?: string; note?: string },
  ) {
    return db.$transaction(async (tx) => {
      const membership = await tx.outletMembership.update({
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

      await tx.loyaltyPointHistory.create({
        data: {
          outletId,
          guestCustomerId,
          orderId: options?.orderId,
          type: LoyaltyPointHistoryType.REDEEM,
          points,
          note: options?.note,
        },
      });

      return membership;
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

  static async findPointHistoryByMember(
    outletId: string,
    guestCustomerId: string,
    skip = 0,
    take = 20,
  ) {
    return db.loyaltyPointHistory.findMany({
      where: {
        outletId,
        guestCustomerId,
      },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            discountAmount: true,
            pointsRedeemed: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    });
  }

  static async countPointHistoryByMember(outletId: string, guestCustomerId: string) {
    return db.loyaltyPointHistory.count({
      where: {
        outletId,
        guestCustomerId,
      },
    });
  }

  static async hasPointHistoryForOrder(orderId: string, type: LoyaltyPointHistoryType) {
    const existing = await db.loyaltyPointHistory.findFirst({
      where: {
        orderId,
        type,
      },
      select: {
        id: true,
      },
    });

    return !!existing;
  }
}
