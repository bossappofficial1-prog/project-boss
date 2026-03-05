import { db } from "../config/prisma";
import { SubscriptionPlanInput, UpdateSubscriptionPlanInput } from "../schemas/subscription-plan.schema";

export class SubscriptionPlanRepository {
    static async getAll() {
        return db.subscriptionPlan.findMany({ orderBy: { createdAt: 'asc' } });
    }

    static async existingBusinessName(name: string) {
        const result = await db.business.findFirst({
            where: { name },
            select: { name: true }
        })

        return !!result?.name
    }

    static async getById(id: string) {
        return db.subscriptionPlan.findUnique({ where: { id } });
    }

    static async getByCode(code: string) {
        return db.subscriptionPlan.findUnique({ where: { code } });
    }

    static async create(data: SubscriptionPlanInput) {
        return db.subscriptionPlan.create({
            data: {
                code: data.code,
                durationDays: data.durationDays,
                features: data.features,
                name: data.name,
                price: data.price,
                promo: data.promo === 0 ? null : data.promo?.toString(),
                isActive: data.isActive,
                isPopular: data.isPopular,
            }
        })
    }

    static async update(subscribetionPlanId: string, data: UpdateSubscriptionPlanInput) {
        return db.subscriptionPlan.update({
            where: {
                id: subscribetionPlanId
            },
            data: { ...data, promo: data.promo === 0 ? null : data.promo?.toString() }
        })
    }

    static async delete(subscribetionPlanId: string) {
        return db.subscriptionPlan.delete({ where: { id: subscribetionPlanId } })
    }
}