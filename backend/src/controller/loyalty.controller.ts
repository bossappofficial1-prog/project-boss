import { Request, Response } from "express";
import { LoyaltyService } from "../service/loyalty.service";
import {
  upsertLoyaltyConfigSchema,
  createLoyaltyTierSchema,
  updateLoyaltyTierSchema,
  createLoyaltyRewardSchema,
  updateLoyaltyRewardSchema,
  redeemRewardSchema,
  registerMembershipSchema,
  getMembersByOutletQuerySchema,
  adjustPointsSchema,
  getPointHistoryQuerySchema,
} from "../schemas/loyalty.schema";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";

export class LoyaltyController {
  // ─── Config ──────────────────────────────────────────────────────────────────
  static async getConfig(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const config = await LoyaltyService.getConfig(outletId);
    return ResponseUtil.success(res, config);
  }

  static async upsertConfig(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const body = upsertLoyaltyConfigSchema.parse(req.body);
    const config = await LoyaltyService.upsertConfig(outletId, body);
    return ResponseUtil.success(res, config, HttpStatus.OK, "Konfigurasi loyalty berhasil diperbarui.");
  }

  // ─── Tiers ───────────────────────────────────────────────────────────────────
  static async getTiers(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const tiers = await LoyaltyService.getTiers(outletId);
    return ResponseUtil.success(res, tiers);
  }

  static async createTier(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const body = createLoyaltyTierSchema.parse(req.body);
    const tier = await LoyaltyService.createTier(outletId, body);
    return ResponseUtil.success(res, tier, HttpStatus.CREATED, "Tier berhasil dibuat.");
  }

  static async updateTier(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const tierId = req.params.tierId as string;
    const body = updateLoyaltyTierSchema.parse(req.body);
    const tier = await LoyaltyService.updateTier(tierId, outletId, body);
    return ResponseUtil.success(res, tier, HttpStatus.OK, "Tier berhasil diperbarui.");
  }

  static async deleteTier(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const tierId = req.params.tierId as string;
    await LoyaltyService.deleteTier(tierId, outletId);
    return ResponseUtil.success(res, null, HttpStatus.OK, "Tier berhasil dihapus.");
  }

  // ─── Rewards ─────────────────────────────────────────────────────────────────
  static async getRewards(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const includeInactive = req.query.includeInactive === "true";
    const rewards = await LoyaltyService.getRewards(outletId, includeInactive);
    return ResponseUtil.success(res, rewards);
  }

  static async createReward(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const body = createLoyaltyRewardSchema.parse(req.body);
    const reward = await LoyaltyService.createReward(outletId, body);
    return ResponseUtil.success(res, reward, HttpStatus.CREATED, "Reward berhasil dibuat.");
  }

  static async updateReward(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const rewardId = req.params.rewardId as string;
    const body = updateLoyaltyRewardSchema.parse(req.body);
    const reward = await LoyaltyService.updateReward(rewardId, outletId, body);
    return ResponseUtil.success(res, reward, HttpStatus.OK, "Reward berhasil diperbarui.");
  }

  static async deleteReward(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const rewardId = req.params.rewardId as string;
    await LoyaltyService.deleteReward(rewardId, outletId);
    return ResponseUtil.success(res, null, HttpStatus.OK, "Reward berhasil dihapus.");
  }

  static async redeemReward(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const body = redeemRewardSchema.parse(req.body);
    const result = await LoyaltyService.redeemReward(
      outletId,
      body.guestCustomerId,
      body.loyaltyRewardId,
      0, // subtotal not needed here unless DISCOUNT_PERCENT
      body.orderId,
    );
    return ResponseUtil.success(res, result, HttpStatus.OK, "Reward berhasil ditukarkan.");
  }

  // ─── Members ─────────────────────────────────────────────────────────────────
  static async registerMember(req: Request, res: Response) {
    const data = registerMembershipSchema.parse(req.body);
    const membership = await LoyaltyService.registerMember(data);
    return ResponseUtil.success(res, membership, HttpStatus.CREATED, "Member berhasil didaftarkan.");
  }

  static async getMembers(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const query = getMembersByOutletQuerySchema.parse(req.query);
    const result = await LoyaltyService.getMembers(
      outletId,
      query.search,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
      query.tier,
    );
    return ResponseUtil.success(res, result);
  }

  static async adjustPoints(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const guestCustomerId = req.params.guestCustomerId as string;
    const { points, note } = adjustPointsSchema.parse(req.body);
    const result = await LoyaltyService.adjustPoints(guestCustomerId, outletId, points, note);
    return ResponseUtil.success(res, result, HttpStatus.OK, points > 0 ? "Poin berhasil ditambahkan." : "Poin berhasil dikurangi.");
  }

  static async getPointHistory(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const guestCustomerId = req.params.guestCustomerId as string;
    const query = getPointHistoryQuerySchema.parse(req.query);
    const result = await LoyaltyService.getMemberPointHistory(outletId, guestCustomerId, query.page, query.limit);
    return ResponseUtil.success(res, result);
  }

  static async getMemberRedemptions(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const guestCustomerId = req.params.guestCustomerId as string;
    const result = await LoyaltyService.getRedemptionsByMember(outletId, guestCustomerId);
    return ResponseUtil.success(res, result);
  }

  static async exportMembers(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const csvData = await LoyaltyService.exportMembersToCSV(outletId);
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=loyalty-members-export-${outletId}-${Date.now()}.csv`);
    return res.send(csvData);
  }

  static async exportRedemptions(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const csvData = await LoyaltyService.exportRedemptionsToCSV(outletId);
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=loyalty-redemptions-export-${outletId}-${Date.now()}.csv`);
    return res.send(csvData);
  }

  static async getDashboardData(req: Request, res: Response) {
    const outletId = req.params.outletId as string;
    const data = await LoyaltyService.getDashboardData(outletId);
    return ResponseUtil.success(res, data);
  }
}
