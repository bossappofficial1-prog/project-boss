import {
  LoyaltyPointHistoryType,
  LoyaltyRewardType,
  OrderStatus,
  PaymentStatus,
  RewardRedemptionStatus,
} from "@prisma/client";
import { LoyaltyRepository } from "../repositories/loyalty.repository";
import { OrderRepository } from "../repositories/order.repository";
import { GuestCustomerRepository } from "../repositories/guest-customer.repository";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import {
  type RegisterMembershipInput,
  type UpsertLoyaltyConfigInput,
  type CreateLoyaltyTierInput,
  type UpdateLoyaltyTierInput,
  type CreateLoyaltyRewardInput,
  type UpdateLoyaltyRewardInput,
} from "../schemas/loyalty.schema";

const WALK_IN_PHONE = "0000000000";

export class LoyaltyService {
  // ═══════════════════════════════════════════════════════════════════════════
  //  CONFIG
  // ═══════════════════════════════════════════════════════════════════════════

  static async upsertConfig(outletId: string, data: UpsertLoyaltyConfigInput) {
    return LoyaltyRepository.upsertLoyaltyConfig(outletId, data);
  }

  static async getConfig(outletId: string) {
    const config = await LoyaltyRepository.getLoyaltyConfig(outletId);
    if (!config) {
      return {
        pointsEarned: 1,
        multiplierAmount: 10000,
        minSpending: 0,
        pointValue: 0,
        isActive: true,
        autoEnroll: true,
        welcomeBonus: 0,
        maxRedeemPercent: 100,
        expiryDays: null,
        minRedeemPoints: 1,
      };
    }
    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  TIERS
  // ═══════════════════════════════════════════════════════════════════════════

  static async getTiers(outletId: string) {
    return LoyaltyRepository.getTiersByOutlet(outletId);
  }

  static async createTier(outletId: string, data: CreateLoyaltyTierInput) {
    return LoyaltyRepository.createTier(outletId, data);
  }

  static async updateTier(id: string, outletId: string, data: UpdateLoyaltyTierInput) {
    const existing = await LoyaltyRepository.getTierById(id);
    if (!existing || existing.outletId !== outletId) {
      throw new AppError("Tier tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    return LoyaltyRepository.updateTier(id, data);
  }

  static async deleteTier(id: string, outletId: string) {
    const existing = await LoyaltyRepository.getTierById(id);
    if (!existing || existing.outletId !== outletId) {
      throw new AppError("Tier tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    // Detach members from this tier
    return LoyaltyRepository.deleteTier(id);
  }

  /** Recalculate and update a member's tier based on their lifetimePoints */
  static async recalculateTier(guestCustomerId: string, outletId: string, lifetimePoints: number) {
    const tier = await LoyaltyRepository.resolveTierForPoints(outletId, lifetimePoints);
    return { tierId: tier?.id ?? null, tier };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  REWARDS
  // ═══════════════════════════════════════════════════════════════════════════

  static async getRewards(outletId: string, includeInactive = false) {
    return LoyaltyRepository.getRewardsByOutlet(outletId, includeInactive);
  }

  static async createReward(outletId: string, data: CreateLoyaltyRewardInput) {
    return LoyaltyRepository.createReward(outletId, {
      ...data,
      imageUrl: data.imageUrl || null,
    });
  }

  static async updateReward(id: string, outletId: string, data: UpdateLoyaltyRewardInput) {
    const existing = await LoyaltyRepository.getRewardById(id);
    if (!existing || existing.outletId !== outletId) {
      throw new AppError("Reward tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    return LoyaltyRepository.updateReward(id, data);
  }

  static async deleteReward(id: string, outletId: string) {
    const existing = await LoyaltyRepository.getRewardById(id);
    if (!existing || existing.outletId !== outletId) {
      throw new AppError("Reward tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    if (existing.redemptions.length > 0) {
      // Soft delete: deactivate instead of hard delete
      return LoyaltyRepository.updateReward(id, { isActive: false });
    }
    return LoyaltyRepository.deleteReward(id);
  }

  /**
   * Redeem a specific reward for a customer.
   * Returns discount info to apply to the order.
   */
  static async redeemReward(
    outletId: string,
    guestCustomerId: string,
    loyaltyRewardId: string,
    subtotal: number,
    orderId?: string,
  ): Promise<{
    pointsUsed: number;
    discountAmount: number;
    rewardType: LoyaltyRewardType;
    rewardName: string;
    redemptionId: string;
    freeProductId: string | null;
  }> {
    const reward = await LoyaltyRepository.getRewardById(loyaltyRewardId);
    if (!reward || reward.outletId !== outletId) {
      throw new AppError("Reward tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    if (!reward.isActive) {
      throw new AppError("Reward tidak aktif.", HttpStatus.BAD_REQUEST);
    }

    // Validasi masa berlaku
    const now = new Date();
    if (reward.validFrom && now < reward.validFrom) {
      throw new AppError("Reward belum berlaku.", HttpStatus.BAD_REQUEST);
    }
    if (reward.validUntil && now > reward.validUntil) {
      throw new AppError("Reward sudah kedaluwarsa.", HttpStatus.BAD_REQUEST);
    }

    // Validasi stok
    if (reward.stock !== -1 && reward.stock <= 0) {
      throw new AppError("Stok reward habis.", HttpStatus.BAD_REQUEST);
    }

    // Validasi poin member
    const membership = await LoyaltyRepository.getMembership(guestCustomerId, outletId);
    if (!membership || membership.totalPoints < reward.pointsCost) {
      throw new AppError(
        `Poin tidak mencukupi. Dibutuhkan: ${reward.pointsCost}, Tersedia: ${membership?.totalPoints ?? 0}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hitung nilai diskon
    let discountAmount = 0;
    const rewardType = reward.type as LoyaltyRewardType;

    switch (rewardType) {
      case LoyaltyRewardType.DISCOUNT_FLAT:
        discountAmount = reward.discountAmount ?? 0;
        break;
      case LoyaltyRewardType.DISCOUNT_PERCENT:
        discountAmount = (subtotal * (reward.discountPercent ?? 0)) / 100;
        if (reward.maxDiscount && discountAmount > reward.maxDiscount) {
          discountAmount = reward.maxDiscount;
        }
        break;
      case LoyaltyRewardType.VOUCHER:
        discountAmount = reward.voucherValue ?? 0;
        break;
      case LoyaltyRewardType.CASHBACK:
        discountAmount = reward.cashbackAmount ?? 0;
        break;
      case LoyaltyRewardType.FREE_ITEM:
        discountAmount = 0; // handled separately via freeProductId
        break;
    }

    // Deduct poin member
    await LoyaltyRepository.deductPointsWithHistory(guestCustomerId, outletId, reward.pointsCost, {
      orderId,
      note: `Penukaran reward: ${reward.name}`,
      historyType: LoyaltyPointHistoryType.REWARD_REDEEM,
    });

    // Buat redemption record
    const redemption = await LoyaltyRepository.createRewardRedemption({
      outletId,
      guestCustomerId,
      loyaltyRewardId,
      orderId,
      pointsUsed: reward.pointsCost,
      note: `Reward ditukar: ${reward.name}`,
    });

    // Kurangi stok jika terbatas
    if (reward.stock !== -1) {
      await LoyaltyRepository.updateReward(loyaltyRewardId, { stock: reward.stock - 1 });
    }

    return {
      pointsUsed: reward.pointsCost,
      discountAmount,
      rewardType,
      rewardName: reward.name,
      redemptionId: redemption.id,
      freeProductId: reward.productId ?? null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  MEMBERSHIP
  // ═══════════════════════════════════════════════════════════════════════════

  static async getMembership(guestCustomerId: string, outletId: string) {
    return LoyaltyRepository.getMembership(guestCustomerId, outletId);
  }

  static async registerMember(data: RegisterMembershipInput) {
    let { guestCustomerId, outletId, name, phone } = data;

    if (!guestCustomerId) {
      if (!phone || !name) {
        throw new AppError("ID Customer atau Nama & No. Telepon harus diisi.", HttpStatus.BAD_REQUEST);
      }
      let customer = await GuestCustomerRepository.findByPhone(phone);
      if (!customer) {
        customer = await GuestCustomerRepository.create({ name, phone });
      }
      guestCustomerId = customer.id;
    }

    const existing = await LoyaltyRepository.getMembership(guestCustomerId, outletId);
    if (existing) {
      throw new AppError("Customer sudah terdaftar sebagai member.", HttpStatus.CONFLICT);
    }

    const membership = await LoyaltyRepository.createMembership(guestCustomerId, outletId);

    // Berikan welcome bonus jika ada
    const config = await this.getConfig(outletId);
    if (config.welcomeBonus > 0) {
      await LoyaltyRepository.addPointsAndSpendingWithHistory(guestCustomerId, outletId, config.welcomeBonus, 0, {
        note: "Welcome bonus untuk member baru",
        historyType: LoyaltyPointHistoryType.WELCOME_BONUS,
      });
    }

    return membership;
  }

  /**
   * Proses perolehan poin saat order selesai
   */
  static async processOrderLoyalty(orderId: string) {
    const order = await OrderRepository.findById(orderId);
    if (!order) return;

    const isPaidOrder =
      (order.orderStatus === OrderStatus.PROCESSING || order.orderStatus === OrderStatus.COMPLETED) &&
      order.paymentStatus === PaymentStatus.SUCCESS;

    if (order.orderStatus !== OrderStatus.COMPLETED && !isPaidOrder) return;

    const alreadyAwarded = await LoyaltyRepository.hasPointHistoryForOrder(
      order.id,
      LoyaltyPointHistoryType.EARN,
    );
    if (alreadyAwarded) return;

    if (order.guestCustomer.phone === WALK_IN_PHONE) return;

    const config = await this.getConfig(order.outletId);
    if (!config.isActive) return;
    if (order.totalAmount < config.minSpending) return;

    // Tentukan apakah member sudah ada atau buat baru
    let membership = await LoyaltyRepository.getMembership(order.guestCustomerId, order.outletId);
    let isNewMember = false;

    if (!membership) {
      if (!config.autoEnroll) return; // auto-enroll dimatikan, skip
      await LoyaltyRepository.createMembership(order.guestCustomerId, order.outletId);
      membership = await LoyaltyRepository.getMembership(order.guestCustomerId, order.outletId);
      isNewMember = true;
    }

    // Hitung tier multiplier berdasarkan lifetime points
    const currentTier = membership?.tier;
    const tierMultiplier = currentTier?.earnMultiplier ?? 1.0;

    // Hitung poin dasar
    const basePoints = Math.floor(order.totalAmount / config.multiplierAmount) * config.pointsEarned;
    const points = Math.floor(basePoints * tierMultiplier);

    if (points <= 0 && !isNewMember) return;

    // Cek tier baru setelah penambahan
    const newLifetimePoints = (membership?.lifetimePoints ?? 0) + points;
    const { tierId } = await this.recalculateTier(order.guestCustomerId, order.outletId, newLifetimePoints);

    // Tambah poin
    if (points > 0) {
      await LoyaltyRepository.addPointsAndSpendingWithHistory(
        order.guestCustomerId,
        order.outletId,
        points,
        order.totalAmount,
        {
          orderId: order.id,
          note: `Poin dari transaksi${tierMultiplier > 1 ? ` (${currentTier?.name} ${tierMultiplier}x multiplier)` : ""}`,
          tierId,
        },
      );
    }

    // Welcome bonus untuk member baru
    if (isNewMember && config.welcomeBonus > 0) {
      await LoyaltyRepository.addPointsAndSpendingWithHistory(
        order.guestCustomerId,
        order.outletId,
        config.welcomeBonus,
        0,
        {
          note: "Welcome bonus untuk member baru",
          historyType: LoyaltyPointHistoryType.WELCOME_BONUS,
          tierId,
        },
      );
    }
  }

  static async adjustPoints(guestCustomerId: string, outletId: string, points: number, note?: string) {
    let membership = await LoyaltyRepository.getMembership(guestCustomerId, outletId);
    if (!membership) {
      await LoyaltyRepository.createMembership(guestCustomerId, outletId);
    }

    // Guard: poin aktif tidak boleh negatif
    if (points < 0 && (membership?.totalPoints ?? 0) + points < 0) {
      throw new AppError(
        `Poin tidak mencukupi. Tersedia: ${membership?.totalPoints ?? 0}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return LoyaltyRepository.adjustPointsWithHistory(guestCustomerId, outletId, points, note);
  }

  static async redeemPoints(guestCustomerId: string, outletId: string, points: number) {
    const membership = await LoyaltyRepository.getMembership(guestCustomerId, outletId);
    if (!membership) throw new AppError("Member tidak ditemukan.", HttpStatus.NOT_FOUND);
    if (membership.totalPoints < points) throw new AppError("Poin tidak mencukupi.", HttpStatus.BAD_REQUEST);

    return LoyaltyRepository.deductPointsWithHistory(guestCustomerId, outletId, points, {
      note: "Penukaran poin",
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  MEMBERS LIST
  // ═══════════════════════════════════════════════════════════════════════════

  static async getMembers(
    outletId: string,
    search?: string,
    page = 1,
    limit = 20,
    sortBy = "joinedAt",
    sortOrder: "asc" | "desc" = "desc",
    tier?: string,
  ) {
    const skip = (page - 1) * limit;

    // Resolve tierId from tier name if provided
    let tierId: string | undefined;
    if (tier) {
      const tiers = await LoyaltyRepository.getTiersByOutlet(outletId);
      tierId = tiers.find((t) => t.name.toLowerCase() === tier.toLowerCase())?.id;
    }

    const [rawMembers, total] = await Promise.all([
      LoyaltyRepository.findMembersByOutlet(outletId, search, skip, limit, sortBy, sortOrder, tierId),
      LoyaltyRepository.countMembersByOutlet(outletId, search, tierId),
    ]);

    const mappedMembers = rawMembers.map((m) => ({
      id: m.id,
      guestCustomerId: m.guestCustomerId,
      outletId: m.outletId,
      points: m.totalPoints,
      lifetimePoints: m.lifetimePoints,
      tier: m.tier ? { id: m.tier.id, name: m.tier.name, color: m.tier.color } : null,
      totalSpending: m.totalSpending || 0,
      lastTransactionAt: m.updatedAt,
      joinedAt: m.joinedAt,
      status: m.status,
      customer: { name: m.guestCustomer.name, phone: m.guestCustomer.phone, email: m.guestCustomer.email },
    }));

    return {
      members: mappedMembers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getMemberPointHistory(outletId: string, guestCustomerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      LoyaltyRepository.findPointHistoryByMember(outletId, guestCustomerId, skip, limit),
      LoyaltyRepository.countPointHistoryByMember(outletId, guestCustomerId),
    ]);

    return {
      history: rows.map((row) => ({
        id: row.id,
        type: row.type,
        points: row.points,
        note: row.note,
        createdAt: row.createdAt,
        order: row.order
          ? {
              id: row.order.id,
              totalAmount: row.order.totalAmount,
              discountAmount: row.order.discountAmount,
              pointsRedeemed: row.order.pointsRedeemed,
              createdAt: row.order.createdAt,
            }
          : null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getRedemptionsByMember(outletId: string, guestCustomerId: string) {
    return LoyaltyRepository.getRedemptionsByMember(outletId, guestCustomerId);
  }

  static async exportMembersToCSV(outletId: string) {
    // Fetch all members by querying with a high limit (e.g. 1000000)
    const result = await this.getMembers(outletId, undefined, 1, 1000000);
    
    let csvContent = "\uFEFF"; // BOM for Excel UTF-8 support
    csvContent += "Nama,Nomor Telepon,Email,Tier,Poin Aktif,Lifetime Poin,Total Belanja,Transaksi Terakhir,Tanggal Bergabung\n";

    for (const member of result.members) {
      const name = member.customer?.name || "-";
      const phone = member.customer?.phone || "-";
      const email = member.customer?.email || "-";
      const tier = member.tier?.name || "-";
      const points = member.points;
      const lifetimePoints = member.lifetimePoints;
      const totalSpending = member.totalSpending;
      const lastTransaction = member.lastTransactionAt ? new Date(member.lastTransactionAt).toLocaleString("id-ID") : "-";
      const joinedAt = member.joinedAt ? new Date(member.joinedAt).toLocaleString("id-ID") : "-";

      const escapedName = `"${name.replace(/"/g, '""')}"`;
      const escapedPhone = `"${phone.replace(/"/g, '""')}"`;
      const escapedEmail = `"${email.replace(/"/g, '""')}"`;
      const escapedTier = `"${tier.replace(/"/g, '""')}"`;

      csvContent += `${escapedName},${escapedPhone},${escapedEmail},${escapedTier},${points},${lifetimePoints},Rp ${totalSpending},${lastTransaction},${joinedAt}\n`;
    }

    return csvContent;
  }

  static async exportRedemptionsToCSV(outletId: string) {
    const redemptions = await LoyaltyRepository.findAllRedemptions(outletId);
    
    let csvContent = "\uFEFF"; // BOM for Excel UTF-8 support
    csvContent += "Tanggal Penukaran,Nama Pelanggan,Nomor Telepon,Email,Reward,Poin Digunakan,Status,Catatan,ID Pesanan\n";

    for (const item of redemptions) {
      const date = item.createdAt ? new Date(item.createdAt).toLocaleString("id-ID") : "-";
      const customerName = item.guestCustomer?.name || "-";
      const customerPhone = item.guestCustomer?.phone || "-";
      const customerEmail = item.guestCustomer?.email || "-";
      const rewardName = item.loyaltyReward?.name || "-";
      const pointsUsed = item.pointsUsed;
      const status = item.status;
      const note = item.note || "-";
      const orderId = item.orderId || "-";

      const escapedName = `"${customerName.replace(/"/g, '""')}"`;
      const escapedPhone = `"${customerPhone.replace(/"/g, '""')}"`;
      const escapedEmail = `"${customerEmail.replace(/"/g, '""')}"`;
      const escapedRewardName = `"${rewardName.replace(/"/g, '""')}"`;
      const escapedNote = `"${note.replace(/"/g, '""')}"`;

      csvContent += `${date},${escapedName},${escapedPhone},${escapedEmail},${escapedRewardName},-${pointsUsed},${status},${escapedNote},${orderId}\n`;
    }

    return csvContent;
  }

  static async getDashboardData(outletId: string) {
    const totalMembers = await LoyaltyRepository.countMembers(outletId);
    const totalActivePoints = await LoyaltyRepository.sumActivePoints(outletId);
    const totalRedeemedPoints = await LoyaltyRepository.sumRedeemedPoints(outletId);
    const totalMemberSpending = await LoyaltyRepository.sumMemberSpending(outletId);

    const tiers = await LoyaltyRepository.getTiersByOutlet(outletId);

    const tierBreakdown = await Promise.all(
      tiers.map(async (t) => {
        const count = await LoyaltyRepository.countMembersByTier(outletId, t.id);
        return {
          name: t.name,
          color: t.color,
          count
        };
      })
    );

    const noTierCount = await LoyaltyRepository.countMembersByTier(outletId, null);
    if (noTierCount > 0) {
      tierBreakdown.push({
        name: "Tanpa Tier",
        color: "#94a3b8",
        count: noTierCount
      });
    }

    const recentRedemptionsRaw = await LoyaltyRepository.findRecentRedemptions(outletId, 10);
    const recentRedemptions = recentRedemptionsRaw.map((r) => ({
      id: r.id,
      customerName: r.guestCustomer.name,
      customerPhone: r.guestCustomer.phone,
      rewardName: r.loyaltyReward.name,
      rewardType: r.loyaltyReward.type,
      pointsUsed: r.pointsUsed,
      status: r.status,
      createdAt: r.createdAt
    }));

    const topMembersRaw = await LoyaltyRepository.findTopMembers(outletId, 5);
    const topMembers = topMembersRaw.map((m) => ({
      name: m.guestCustomer.name,
      phone: m.guestCustomer.phone,
      points: m.totalPoints,
      lifetimePoints: m.lifetimePoints,
      tierName: m.tier?.name || "Tanpa Tier",
      tierColor: m.tier?.color || "#94a3b8"
    }));

    return {
      stats: {
        totalMembers,
        totalActivePoints,
        totalRedeemedPoints,
        totalMemberSpending
      },
      tierBreakdown,
      recentRedemptions,
      topMembers
    };
  }
}
