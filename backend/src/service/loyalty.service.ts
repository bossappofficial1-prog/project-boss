import { LoyaltyPointHistoryType, OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "../config/prisma";
import { LoyaltyRepository } from "../repositories/loyalty.repository";
import { OrderRepository } from "../repositories/order.repository";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { type RegisterMembershipInput } from "../schemas/loyalty.schema";
import { GuestCustomerRepository } from "../repositories/guest-customer.repository";

export class LoyaltyService {
  /**
   * Mengatur konfigurasi loyalty untuk outlet
   */
  static async upsertConfig(outletId: string, data: {
    pointsEarned: number;
    multiplierAmount: number;
    minSpending: number;
    pointValue: number;
    isActive: boolean;
  }) {
    return LoyaltyRepository.upsertLoyaltyConfig(outletId, data);
  }

  /**
   * Mendapatkan konfigurasi loyalty outlet
   */
  static async getConfig(outletId: string) {
    let config = await LoyaltyRepository.getLoyaltyConfig(outletId);

    // Jika belum ada, kembalikan default
    if (!config) {
      return {
        pointsEarned: 1,
        multiplierAmount: 10000,
        minSpending: 0,
        pointValue: 0,
        isActive: true
      };
    }

    return config;
  }

  /**
   * Mendapatkan data membership customer
   */
  static async getMembership(guestCustomerId: string, outletId: string) {
    return LoyaltyRepository.getMembership(guestCustomerId, outletId);
  }

  /**
   * Pendaftaran membership secara manual
   */
  static async registerMember(data: RegisterMembershipInput) {
    let { guestCustomerId, outletId, name, phone } = data;

    // Jika tidak ada ID, cari atau buat berdasarkan phone
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
      throw new AppError("Customer sudah terdaftar sebagai member di outlet ini.", HttpStatus.CONFLICT);
    }

    const membership = await db.outletMembership.create({
      data: {
        guestCustomerId,
        outletId,
        status: "ACTIVE",
      },
      include: {
        guestCustomer: true,
      }
    });

    return {
      id: membership.id,
      guestCustomerId: membership.guestCustomerId,
      outletId: membership.outletId,
      points: membership.totalPoints,
      tier: "Bronze", // Default for new member
      totalSpending: 0,
      lastTransactionAt: membership.updatedAt,
      joinedAt: membership.joinedAt,
      customer: {
        name: membership.guestCustomer.name,
        phone: membership.guestCustomer.phone
      }
    };
  }

  /**
   * Proses perhitungan poin saat order selesai
   */
  static async processOrderLoyalty(orderId: string) {
    console.log(`[LOYALTY] Processing points for order: ${orderId}`);
    const order = await OrderRepository.findById(orderId);

    if (!order) {
      console.log(`[LOYALTY] Order not found: ${orderId}`);
      return;
    }

    console.log(`[LOYALTY] Order status: ${order.orderStatus}, Phone: ${order.guestCustomer?.phone}`);

    // Syarat penambahan poin:
    // 1. Order status COMPLETED (umum)
    // 2. ATAU Order status PROCESSING + handledByStaff (POS) + payment SUCCESS (QRIS POS/Paid)
    const isPaidOrder = (order.orderStatus === OrderStatus.PROCESSING || order.orderStatus === OrderStatus.COMPLETED) &&
      order.paymentStatus === PaymentStatus.SUCCESS;

    if (order.orderStatus !== OrderStatus.COMPLETED && !isPaidOrder) {
      console.log(`[LOYALTY] Order not eligible for points yet (Status: ${order.orderStatus}, Payment: ${order.paymentStatus}). Skipping.`);
      return;
    }

    const alreadyAwarded = await LoyaltyRepository.hasPointHistoryForOrder(
      order.id,
      LoyaltyPointHistoryType.EARN,
    );
    if (alreadyAwarded) {
      console.log(`[LOYALTY] Points already awarded for order: ${order.id}. Skipping.`);
      return;
    }

    // Abaikan walk-in customer (phone: 0000000000)
    if (order.guestCustomer.phone === "0000000000") {
      console.log(`[LOYALTY] Walk-in customer. Skipping.`);
      return;
    }

    const config = await this.getConfig(order.outletId);
    console.log(`[LOYALTY] Config: ${JSON.stringify(config)}`);

    if (!config.isActive) {
      console.log(`[LOYALTY] Config is inactive. Skipping.`);
      return;
    }

    // Cek min spending
    if (order.totalAmount < config.minSpending) {
      console.log(`[LOYALTY] Total amount (${order.totalAmount}) < min spending (${config.minSpending}). Skipping.`);
      return;
    }

    // Hitung poin (Floor calculation: pembulatan ke bawah)
    const points = Math.floor(order.totalAmount / config.multiplierAmount) * config.pointsEarned;
    console.log(`[LOYALTY] Calculated points: ${points} (Amount: ${order.totalAmount}, Multiplier: ${config.multiplierAmount}, Earned: ${config.pointsEarned})`);

    if (points <= 0) {
      console.log(`[LOYALTY] Zero points. Skipping.`);
      return;
    }

    // Cek/Buat Membership
    const existingMembership = await LoyaltyRepository.getMembership(order.guestCustomerId, order.outletId);
    if (!existingMembership) {
      console.log(`[LOYALTY] Creating new membership for customer: ${order.guestCustomerId}`);
      await LoyaltyRepository.createMembership(order.guestCustomerId, order.outletId);
    }

    // Tambah poin dan total belanja
    console.log(`[LOYALTY] Adding ${points} points and Rp ${order.totalAmount} spending to member.`);
    return LoyaltyRepository.addPointsAndSpendingWithHistory(
      order.guestCustomerId,
      order.outletId,
      points,
      order.totalAmount,
      {
        orderId: order.id,
        note: "Poin didapat dari transaksi selesai",
      },
    );
  }

  /**
   * List member per outlet dengan point
   */
  static async getMembers(outletId: string, search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [rawMembers, total] = await Promise.all([
      LoyaltyRepository.findMembersByOutlet(outletId, search, skip, limit),
      LoyaltyRepository.countMembersByOutlet(outletId, search)
    ]);

    const mappedMembers = rawMembers.map(m => {
      // Basic tier logic
      let tier = "Bronze";
      if (m.totalPoints >= 1000) tier = "Gold";
      else if (m.totalPoints >= 500) tier = "Silver";

      return {
        id: m.id,
        guestCustomerId: m.guestCustomerId,
        outletId: m.outletId,
        points: m.totalPoints,
        tier: tier,
        totalSpending: m.totalSpending || 0,
        lastTransactionAt: m.updatedAt,
        joinedAt: m.joinedAt,
        customer: {
          name: m.guestCustomer.name,
          phone: m.guestCustomer.phone
        }
      };
    });

    return {
      members: mappedMembers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Penyesuaian poin secara manual oleh owner
   */
  static async adjustPoints(guestCustomerId: string, outletId: string, points: number) {
    // Pastikan membership ada
    const membership = await LoyaltyRepository.getMembership(guestCustomerId, outletId);
    if (!membership) {
      // Jika belum ada, buat dulu
      await LoyaltyRepository.createMembership(guestCustomerId, outletId);
    }

    return LoyaltyRepository.adjustPointsWithHistory(
      guestCustomerId,
      outletId,
      points,
      "Penyesuaian poin oleh owner",
    );
  }

  /**
   * Penukaran poin (Redemption)
   */
  static async redeemPoints(guestCustomerId: string, outletId: string, points: number) {
    const membership = await LoyaltyRepository.getMembership(guestCustomerId, outletId);
    if (!membership) {
      throw new AppError("Member tidak ditemukan.", HttpStatus.NOT_FOUND);
    }

    if (membership.totalPoints < points) {
      throw new AppError("Poin tidak mencukupi.", HttpStatus.BAD_REQUEST);
    }

    return LoyaltyRepository.deductPointsWithHistory(
      guestCustomerId,
      outletId,
      points,
      { note: "Penukaran poin" },
    );
  }

  static async getMemberPointHistory(
    outletId: string,
    guestCustomerId: string,
    page = 1,
    limit = 20,
  ) {
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
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
