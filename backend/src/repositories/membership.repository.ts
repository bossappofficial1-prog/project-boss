import { Membership } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateMembershipInput, UpdateMembershipInput } from "../schemas/membership.schema";

export class MembershipRepository {
    static async create(data: CreateMembershipInput): Promise<Membership> {
        return db.membership.create({
            data,
        });
    }

    static async findById(id: string): Promise<Membership | null> {
        return db.membership.findUnique({
            where: { id },
        });
    }

    static async findByBusinessId(businessId: string): Promise<Membership[]> {
        return db.membership.findMany({
            where: { businessId },
        });
    }

    static async update(id: string, data: UpdateMembershipInput): Promise<Membership> {
        return db.membership.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string): Promise<Membership> {
        return db.membership.delete({
            where: { id },
        });
    }
}