import { describe, expect, it, beforeAll, afterAll, beforeEach } from "bun:test";
import { db } from "../src/config/prisma";
import { LoyaltyService } from "../src/service/loyalty.service";
import { LoyaltyPointHistoryType, LoyaltyRewardType, UserRole } from "@prisma/client";

describe("Loyalty Service Revamp Unit Tests", () => {
  let businessId: string;
  let ownerId: string;
  let outletId: string;
  let customerId: string;

  beforeAll(async () => {
    // 1. Buat User OWNER
    const email = `owner-loyalty-${Date.now()}@example.com`;
    const user = await db.user.create({
      data: {
        email,
        name: "Loyalty Owner",
        password: "password123",
        role: UserRole.OWNER,
        isVerified: true,
      },
    });
    ownerId = user.id;

    // 2. Buat Business
    const business = await db.business.create({
      data: {
        name: "Loyalty Business",
        ownerId,
      },
    });
    businessId = business.id;

    // 3. Buat Outlet
    const outlet = await db.outlet.create({
      data: {
        name: "Loyalty Outlet",
        slug: `loyalty-outlet-${Date.now()}`,
        businessId,
      },
    });
    outletId = outlet.id;

    // 4. Buat GuestCustomer
    const customer = await db.guestCustomer.create({
      data: {
        name: "Loyalty Guest",
        phone: `0812345-${Date.now()}`,
      },
    });
    customerId = customer.id;
  });

  afterAll(async () => {
    // Clean up
    await db.rewardRedemption.deleteMany({ where: { outletId } });
    await db.loyaltyPointHistory.deleteMany({ where: { outletId } });
    await db.outletMembership.deleteMany({ where: { outletId } });
    await db.loyaltyReward.deleteMany({ where: { outletId } });
    await db.loyaltyTier.deleteMany({ where: { outletId } });
    await db.loyaltyConfig.deleteMany({ where: { outletId } });
    await db.outlet.deleteMany({ where: { id: outletId } });
    await db.business.deleteMany({ where: { id: businessId } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.guestCustomer.deleteMany({ where: { id: customerId } });

    await db.$disconnect();
  });

  describe("Loyalty Config", () => {
    it("should get default config if not set", async () => {
      const config = await LoyaltyService.getConfig(outletId);
      expect(config.pointsEarned).toBe(1);
      expect(config.multiplierAmount).toBe(10000);
      expect(config.isActive).toBe(true);
    });

    it("should upsert and get custom config", async () => {
      await LoyaltyService.upsertConfig(outletId, {
        pointsEarned: 5,
        multiplierAmount: 20000,
        minSpending: 10000,
        pointValue: 100,
        isActive: true,
        autoEnroll: true,
        welcomeBonus: 50,
        maxRedeemPercent: 50,
        expiryDays: 30,
        minRedeemPoints: 10,
      });

      const config = await LoyaltyService.getConfig(outletId);
      expect(config.pointsEarned).toBe(5);
      expect(config.multiplierAmount).toBe(20000);
      expect(config.welcomeBonus).toBe(50);
      expect(config.maxRedeemPercent).toBe(50);
      expect(config.expiryDays).toBe(30);
      expect(config.minRedeemPoints).toBe(10);
    });
  });

  describe("Loyalty Tiers", () => {
    let tierSilverId: string;
    let tierGoldId: string;

    it("should create tiers successfully", async () => {
      const silver = await LoyaltyService.createTier(outletId, {
        name: "Silver",
        color: "#C0C0C0",
        minLifetimePoints: 100,
        earnMultiplier: 1.5,
        sortOrder: 1,
        benefits: "1.5x points multiplier",
      });

      const gold = await LoyaltyService.createTier(outletId, {
        name: "Gold",
        color: "#FFD700",
        minLifetimePoints: 500,
        earnMultiplier: 2.0,
        sortOrder: 2,
        benefits: "2x points multiplier + free drinks",
      });

      expect(silver.name).toBe("Silver");
      expect(gold.name).toBe("Gold");
      expect(gold.earnMultiplier).toBe(2.0);

      tierSilverId = silver.id;
      tierGoldId = gold.id;
    });

    it("should list tiers by outlet", async () => {
      const tiers = await LoyaltyService.getTiers(outletId);
      expect(tiers.length).toBe(2);
      expect(tiers[0].name).toBe("Silver");
      expect(tiers[1].name).toBe("Gold");
    });

    it("should update tier successfully", async () => {
      const updated = await LoyaltyService.updateTier(tierSilverId, outletId, {
        benefits: "Updated Silver Benefits",
      });
      expect(updated.benefits).toBe("Updated Silver Benefits");
    });

    it("should resolve tier correctly for points", async () => {
      // 50 points -> no tier (null)
      const res1 = await LoyaltyService.recalculateTier(customerId, outletId, 50);
      expect(res1.tierId).toBeNull();

      // 150 points -> Silver
      const res2 = await LoyaltyService.recalculateTier(customerId, outletId, 150);
      expect(res2.tierId).toBe(tierSilverId);
      expect(res2.tier?.name).toBe("Silver");

      // 600 points -> Gold
      const res3 = await LoyaltyService.recalculateTier(customerId, outletId, 600);
      expect(res3.tierId).toBe(tierGoldId);
      expect(res3.tier?.name).toBe("Gold");
    });
  });

  describe("Membership", () => {
    it("should register customer as member & apply welcome bonus", async () => {
      const membership = await LoyaltyService.registerMember({
        guestCustomerId: customerId,
        outletId,
      });

      expect(membership.status).toBe("ACTIVE");

      // Cek welcome bonus (config welcomeBonus adalah 50)
      const updatedMembership = await LoyaltyService.getMembership(customerId, outletId);
      expect(updatedMembership?.totalPoints).toBe(50);
      expect(updatedMembership?.lifetimePoints).toBe(50);
    });

    it("should adjust member points", async () => {
      await LoyaltyService.adjustPoints(customerId, outletId, 25, "Manual bonus");
      let membership = await LoyaltyService.getMembership(customerId, outletId);
      expect(membership?.totalPoints).toBe(75); // 50 + 25

      await LoyaltyService.adjustPoints(customerId, outletId, -15, "Manual deduct");
      membership = await LoyaltyService.getMembership(customerId, outletId);
      expect(membership?.totalPoints).toBe(60); // 75 - 15
    });

    it("should get members with pagination and filters", async () => {
      const res = await LoyaltyService.getMembers(outletId, undefined, 1, 10);
      expect(res.members.length).toBe(1);
      expect(res.members[0].points).toBe(60);
      expect(res.members[0].customer.name).toBe("Loyalty Guest");
    });
  });

  describe("Loyalty Rewards & Redemptions", () => {
    let rewardId: string;

    it("should create active reward successfully", async () => {
      const reward = await LoyaltyService.createReward(outletId, {
        name: "Diskon Flat 10rb",
        type: LoyaltyRewardType.DISCOUNT_FLAT,
        pointsCost: 50,
        discountAmount: 10000,
        stock: 5,
        isActive: true,
      });

      expect(reward.name).toBe("Diskon Flat 10rb");
      expect(reward.pointsCost).toBe(50);
      expect(reward.stock).toBe(5);

      rewardId = reward.id;
    });

    it("should redeem reward successfully", async () => {
      const result = await LoyaltyService.redeemReward(
        outletId,
        customerId,
        rewardId,
        50000, // subtotal
      );

      expect(result.pointsUsed).toBe(50);
      expect(result.discountAmount).toBe(10000);
      expect(result.rewardType).toBe(LoyaltyRewardType.DISCOUNT_FLAT);

      // Cek poin member sisa
      const membership = await LoyaltyService.getMembership(customerId, outletId);
      expect(membership?.totalPoints).toBe(10); // 60 - 50 = 10

      // Cek stok reward berkurang
      const rewards = await LoyaltyService.getRewards(outletId);
      expect(rewards[0].stock).toBe(4); // 5 - 1 = 4
    });

    it("should error if points not enough", async () => {
      expect(
        LoyaltyService.redeemReward(outletId, customerId, rewardId, 50000)
      ).rejects.toThrow(/Poin tidak mencukupi/);
    });
  });
});
