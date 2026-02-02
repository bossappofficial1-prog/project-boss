import { db } from "../config/prisma";
import { SubscriptionPlanInput, UpdateSubscriptionPlanInput } from "../schemas/subscription-plan.schema";

export class SubscriptionPlanRepository {
    static async getAll() {
        return db.subscriptionPlan.findMany({ orderBy: { createdAt: 'asc' } });
    }

    static async getById(id: string) {
        return db.subscriptionPlan.findUnique({ where: { id } });
    }

    static async create(data: SubscriptionPlanInput) {
        return db.subscriptionPlan.create({
            data: {
                code: data.code,
                durationDays: data.durationDays,
                features: data.features,
                name: data.name,
                price: data.price,
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
            data
        })
    }

    static async delete(subscribetionPlanId: string) {
        return db.subscriptionPlan.delete({ where: { id: subscribetionPlanId } })
    }
}