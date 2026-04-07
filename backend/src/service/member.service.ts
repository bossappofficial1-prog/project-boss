import { MemberRepository } from "../repositories/member.repository";
import {
  CreateMemberInput,
  GetMembersByOutletQuery,
  UpdateMemberInput,
} from "../schemas/member.schema";
import { RedisUtils } from "../utils/redis.utils";

export class MemberService {
  static async createMember(data: CreateMemberInput) {
    const existing = await MemberRepository.findByPhone(data.phone);
    if (existing) {
      throw new Error("PHONE_TAKEN");
    }
    const member = await MemberRepository.create(data);

    await RedisUtils.deleteByPattern("members:list:*");

    return member;
  }

  static async getMembersByOutlet(outletId: string, query: GetMembersByOutletQuery) {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const cacheKey = `members:list:${outletId}:${search || ""}:${page}:${limit}`;
    const cached = await RedisUtils.get<{ members: any[]; total: number }>(cacheKey);
    if (cached) return {
      ...cached,
      pagination: {
        total: cached.total,
        page,
        limit,
        totalPages: Math.ceil(cached.total / limit),
      }
    };

    const { members, total } = await MemberRepository.findByOutletId(outletId, search, skip, limit);

    const result = {
      members,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await RedisUtils.set(cacheKey, { members, total }, 3600); // 1 hour

    return result;
  }

  static async getMemberById(id: string, outletId?: string) {
    const cacheKey = `members:detail:${id}:${outletId || "all"}`;
    const cached = await RedisUtils.get<any>(cacheKey);
    if (cached) return cached;

    const member = await MemberRepository.findById(id, outletId);
    if (!member) return null;

    const totalPoint = await MemberRepository.getTotalPoint(id, outletId);
    const result = { ...member, totalPoint };

    await RedisUtils.set(cacheKey, result, 3600); // 1 hour
    return result;
  }

  static async updateMember(id: string, data: UpdateMemberInput) {
    if (data.phone) {
      const existing = await MemberRepository.findByPhone(data.phone);
      if (existing && existing.id !== id) {
        throw new Error("PHONE_TAKEN");
      }
    }
    const updated = await MemberRepository.update(id, data);

    // Invalidate caches
    await RedisUtils.deleteByPattern(`members:detail:${id}:*`);
    await RedisUtils.deleteByPattern(`members:list:*`);

    return updated;
  }

  static async increasePoint(guestCustomerId: string, orderId: string, point: number) {
    const result = await MemberRepository.increasePoint(guestCustomerId, orderId, point);
    await RedisUtils.deleteByPattern(`members:detail:${guestCustomerId}:*`);
    return result;
  }

  static async deleteMember(id: string) {
    const result = await MemberRepository.delete(id);
    await RedisUtils.deleteByPattern(`members:detail:${id}:*`);
    await RedisUtils.deleteByPattern(`members:list:*`);
    return result;
  }
}
