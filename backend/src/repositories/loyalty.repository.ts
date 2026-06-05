import { db } from "../config/prisma";
import { LoyaltyPointHistoryType, RewardRedemptionStatus } from "@prisma/client";

export class LoyaltyRepository {
  // ─── Config ──────────────────────────────────────────────────────────────────
  static async getLoyaltyConfig(outletId: string) {
    return db.loyaltyConfig.findUnique({ where: { outletId } });
  }

  static async upsertLoyaltyConfig(outletId: string, data: {
    pointsEarned?: number;
    multiplierAmount?: number;
    minSpending?: number;
    pointValue?: number;
    isActive?: boolean;
    autoEnroll?: boolean;
    welcomeBonus?: number;
    maxRedeemPercent?: number;
    expiryDays?: number | null;
    minRedeemPoints?: number;
  }) {
    return db.loyaltyConfig.upsert({
      where: { outletId },
      update: data,
      create: { ...data, outletId },
    });
  }

  // ─── Tiers ───────────────────────────────────────────────────────────────────
  static async getTiersByOutlet(outletId: string) {
    return db.loyaltyTier.findMany({
      where: { outletId },
      orderBy: { sortOrder: "asc" },
    });
  }

  static async getTierById(id: string) {
    return db.loyaltyTier.findUnique({ where: { id } });
  }

  static async createTier(outletId: string, data: {
    name: string;
    color?: string;
    minLifetimePoints?: number;
    earnMultiplier?: number;
    sortOrder?: number;
    benefits?: string;
  }) {
    return db.loyaltyTier.create({ data: { ...data, outletId } });
  }

  static async updateTier(id: string, data: Partial<{
    name: string;
    color: string;
    minLifetimePoints: number;
    earnMultiplier: number;
    sortOrder: number;
    benefits: string | null;
  }>) {
    return db.loyaltyTier.update({ where: { id }, data });
  }

  static async deleteTier(id: string) {
    return db.loyaltyTier.delete({ where: { id } });
  }

  /** Cari tier yang tepat berdasarkan lifetimePoints */
  static async resolveTierForPoints(outletId: string, lifetimePoints: number) {
    return db.loyaltyTier.findFirst({
      where: {
        outletId,
        minLifetimePoints: { lte: lifetimePoints },
      },
      orderBy: { minLifetimePoints: "desc" }, // ambil tier tertinggi yang memenuhi syarat
    });
  }

  // ─── Rewards ─────────────────────────────────────────────────────────────────
  static async getRewardsByOutlet(outletId: string, includeInactive = false) {
    return db.loyaltyReward.findMany({
      where: {
        outletId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { pointsCost: "asc" },
    });
  }

  static async getRewardById(id: string) {
    return db.loyaltyReward.findUnique({
      where: { id },
      include: { redemptions: { where: { status: "USED" }, select: { id: true } } },
    });
  }

  static async createReward(outletId: string, data: any) {
    return db.loyaltyReward.create({ data: { ...data, outletId } });
  }

  static async updateReward(id: string, data: any) {
    return db.loyaltyReward.update({ where: { id }, data });
  }

  static async deleteReward(id: string) {
    return db.loyaltyReward.delete({ where: { id } });
  }

  // ─── Redemptions ──────────────────────────────────────────────────────────────
  static async createRewardRedemption(data: {
    outletId: string;
    guestCustomerId: string;
    loyaltyRewardId: string;
    orderId?: string;
    pointsUsed: number;
    note?: string;
  }) {
    return db.rewardRedemption.create({ data: { ...data, status: RewardRedemptionStatus.PENDING } });
  }

  static async updateRedemptionStatus(id: string, status: RewardRedemptionStatus) {
    return db.rewardRedemption.update({ where: { id }, data: { status } });
  }

  static async getRedemptionsByMember(outletId: string, guestCustomerId: string) {
    return db.rewardRedemption.findMany({
      where: { outletId, guestCustomerId },
      include: { loyaltyReward: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // ─── Membership ───────────────────────────────────────────────────────────────
  static async getMembership(guestCustomerId: string, outletId: string) {
    return db.outletMembership.findUnique({
      where: { guestCustomerId_outletId: { guestCustomerId, outletId } },
      include: { guestCustomer: true, tier: true },
    });
  }

  static async createMembership(guestCustomerId: string, outletId: string) {
    return db.outletMembership.create({
      data: { guestCustomerId, outletId, status: "ACTIVE" },
    });
  }

  /**
   * Tambah poin + spending + lifetime points, dan update tier secara atomik
   */
  static async addPointsAndSpendingWithHistory(
    guestCustomerId: string,
    outletId: string,
    points: number,
    spending: number,
    options?: { orderId?: string; note?: string; tierId?: string | null; historyType?: LoyaltyPointHistoryType },
  ) {
    return db.$transaction(async (tx) => {
      const membership = await tx.outletMembership.update({
        where: { guestCustomerId_outletId: { guestCustomerId, outletId } },
        data: {
          totalPoints: { increment: points },
          lifetimePoints: { increment: points },
          totalSpending: { increment: spending },
          ...(options?.tierId !== undefined ? { tierId: options.tierId } : {}),
        },
      });

      if (points > 0) {
        await tx.loyaltyPointHistory.create({
          data: {
            outletId,
            guestCustomerId,
            orderId: options?.orderId,
            type: options?.historyType ?? LoyaltyPointHistoryType.EARN,
            points,
            note: options?.note ?? "Poin didapat dari transaksi selesai",
          },
        });
      }

      return membership;
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
        where: { guestCustomerId_outletId: { guestCustomerId, outletId } },
        data: {
          totalPoints: { increment: points },
          // lifetime hanya naik untuk poin positif
          ...(points > 0 ? { lifetimePoints: { increment: points } } : {}),
        },
      });

      await tx.loyaltyPointHistory.create({
        data: {
          outletId,
          guestCustomerId,
          type: points > 0 ? LoyaltyPointHistoryType.ADJUSTMENT_IN : LoyaltyPointHistoryType.ADJUSTMENT_OUT,
          points: Math.abs(points),
          note: note ?? (points > 0 ? "Penyesuaian poin oleh owner" : "Pengurangan poin oleh owner"),
        },
      });

      return membership;
    });
  }

  static async deductPointsWithHistory(
    guestCustomerId: string,
    outletId: string,
    points: number,
    options?: { orderId?: string; note?: string; historyType?: LoyaltyPointHistoryType },
  ) {
    return db.$transaction(async (tx) => {
      const membership = await tx.outletMembership.update({
        where: { guestCustomerId_outletId: { guestCustomerId, outletId } },
        data: { totalPoints: { decrement: points } },
      });

      await tx.loyaltyPointHistory.create({
        data: {
          outletId,
          guestCustomerId,
          orderId: options?.orderId,
          type: options?.historyType ?? LoyaltyPointHistoryType.REDEEM,
          points,
          note: options?.note ?? "Penukaran poin",
        },
      });

      return membership;
    });
  }

  static async refundLoyaltyPoints(
    outletId: string,
    guestCustomerId: string,
    orderId: string,
    points: number,
  ) {
    return db.$transaction([
      db.outletMembership.update({
        where: { guestCustomerId_outletId: { guestCustomerId, outletId } },
        data: { totalPoints: { increment: points } },
      }),
      db.loyaltyPointHistory.create({
        data: {
          outletId,
          guestCustomerId,
          type: LoyaltyPointHistoryType.ADJUSTMENT_IN,
          points,
          note: "Refund poin akibat penghapusan transaksi",
        },
      }),
    ]);
  }

  // ─── Members list ─────────────────────────────────────────────────────────────
  static async findMembersByOutlet(
    outletId: string,
    search?: string,
    skip = 0,
    limit = 20,
    sortBy = "joinedAt",
    sortOrder: "asc" | "desc" = "desc",
    tierId?: string,
  ) {
    const orderByMap: Record<string, any> = {
      points: { totalPoints: sortOrder },
      spending: { totalSpending: sortOrder },
      joinedAt: { joinedAt: sortOrder },
      lifetimePoints: { lifetimePoints: sortOrder },
    };

    return db.outletMembership.findMany({
      where: {
        outletId,
        ...(tierId ? { tierId } : {}),
        ...(search
          ? {
            guestCustomer: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
              ],
            },
          }
          : {}),
      },
      include: {
        guestCustomer: { select: { name: true, phone: true, email: true } },
        tier: { select: { id: true, name: true, color: true } },
      },
      skip,
      take: limit,
      orderBy: orderByMap[sortBy] ?? { joinedAt: "desc" },
    });
  }

  static async countMembersByOutlet(outletId: string, search?: string, tierId?: string) {
    return db.outletMembership.count({
      where: {
        outletId,
        ...(tierId ? { tierId } : {}),
        ...(search
          ? {
            guestCustomer: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
              ],
            },
          }
          : {}),
      },
    });
  }

  static async hasPointHistoryForOrder(orderId: string, type: LoyaltyPointHistoryType) {
    const record = await db.loyaltyPointHistory.findFirst({ where: { orderId, type } });
    return !!record;
  }

  static async findPointHistoryByMember(
    outletId: string,
    guestCustomerId: string,
    skip = 0,
    limit = 20,
  ) {
    return db.loyaltyPointHistory.findMany({
      where: { outletId, guestCustomerId },
      include: {
        order: {
          select: { id: true, totalAmount: true, discountAmount: true, pointsRedeemed: true, createdAt: true },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  static async countPointHistoryByMember(outletId: string, guestCustomerId: string) {
    return db.loyaltyPointHistory.count({ where: { outletId, guestCustomerId } });
  }

  static async countMembers(outletId: string) {
    return db.outletMembership.count({
      where: { outletId, status: "ACTIVE" }
    });
  }

  static async sumActivePoints(outletId: string) {
    const res = await db.outletMembership.aggregate({
      where: { outletId, status: "ACTIVE" },
      _sum: { totalPoints: true }
    });
    return res._sum.totalPoints || 0;
  }

  static async sumRedeemedPoints(outletId: string) {
    const res = await db.rewardRedemption.aggregate({
      where: { outletId, status: "USED" },
      _sum: { pointsUsed: true }
    });
    return res._sum.pointsUsed || 0;
  }

  static async sumMemberSpending(outletId: string) {
    const res = await db.outletMembership.aggregate({
      where: { outletId, status: "ACTIVE" },
      _sum: { totalSpending: true }
    });
    return res._sum.totalSpending || 0;
  }

  static async countMembersByTier(outletId: string, tierId: string | null) {
    return db.outletMembership.count({
      where: { outletId, tierId, status: "ACTIVE" }
    });
  }

  static async findRecentRedemptions(outletId: string, limit = 10) {
    return db.rewardRedemption.findMany({
      where: { outletId },
      include: {
        guestCustomer: { select: { name: true, phone: true } },
        loyaltyReward: { select: { name: true, type: true } }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  static async findTopMembers(outletId: string, limit = 5) {
    return db.outletMembership.findMany({
      where: { outletId, status: "ACTIVE" },
      include: {
        guestCustomer: { select: { name: true, phone: true } },
        tier: { select: { name: true, color: true } }
      },
      orderBy: { totalPoints: "desc" },
      take: limit
    });
  }

  static async findAllRedemptions(outletId: string) {
    return db.rewardRedemption.findMany({
      where: { outletId },
      include: {
        guestCustomer: { select: { name: true, phone: true, email: true } },
        loyaltyReward: { select: { name: true, type: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }
}

