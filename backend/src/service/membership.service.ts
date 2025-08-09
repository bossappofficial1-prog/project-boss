import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { MembershipRepository } from "../repositories/membership.repository";
import { CreateMembershipInput, UpdateMembershipInput } from "../schemas/membership.schema";

export async function createMembershipService(data: CreateMembershipInput) {
    // TODO: Tambahkan validasi untuk memastikan businessId dan guestCustomerId ada
    const membership = await MembershipRepository.create(data);
    return membership;
}

export async function getMembershipByIdService(id: string) {
    const membership = await MembershipRepository.findById(id);
    if (!membership) {
        throw new AppError(Messages.MEMBERSHIP_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return membership;
}

export async function getMembershipsByBusinessIdService(businessId: string) {
    const memberships = await MembershipRepository.findByBusinessId(businessId);
    return memberships;
}

export async function updateMembershipService(id: string, data: UpdateMembershipInput) {
    await getMembershipByIdService(id);
    const membership = await MembershipRepository.update(id, data);
    return membership;
}

export async function deleteMembershipService(id: string) {
    await getMembershipByIdService(id);
    const membership = await MembershipRepository.delete(id);
    return membership;
}