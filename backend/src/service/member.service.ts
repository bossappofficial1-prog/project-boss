import { MemberRepository } from "../repositories/member.repository";
import {
  CreateMemberInput,
  GetMembersByOutletQuery,
  UpdateMemberInput,
} from "../schemas/member.schema";

export class MemberService {
  static async createMember(data: CreateMemberInput) {
    const existing = await MemberRepository.findByPhone(data.phone);
    if (existing) {
      throw new Error("PHONE_TAKEN");
    }
    return MemberRepository.create(data);
  }

  static async getMembersByOutlet(outletId: string, query: GetMembersByOutletQuery) {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const { members, total } = await MemberRepository.findByOutletId(outletId, search, skip, limit);

    return {
      members,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getMemberById(id: string, outletId?: string) {
    const member = await MemberRepository.findById(id, outletId);
    if (!member) return null;

    const totalPoint = await MemberRepository.getTotalPoint(id, outletId);
    return { ...member, totalPoint };
  }

  static async updateMember(id: string, data: UpdateMemberInput) {
    if (data.phone) {
      const existing = await MemberRepository.findByPhone(data.phone);
      if (existing && existing.id !== id) {
        throw new Error("PHONE_TAKEN");
      }
    }
    return MemberRepository.update(id, data);
  }

  static async increasePoint(guestCustomerId: string, orderId: string, point: number) {
    return MemberRepository.increasePoint(guestCustomerId, orderId, point);
  }

  static async deleteMember(id: string) {
    return MemberRepository.delete(id);
  }
}
