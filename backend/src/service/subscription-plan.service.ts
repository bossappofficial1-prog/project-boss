import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import { SubscriptionPlanRepository } from "../repositories/subscription-plan.repository";
import { SubscriptionPlanInput, UpdateSubscriptionPlanInput } from "../schemas/subscription-plan.schema";

export class SubscriptionPlanService {
    static async getAll() {
        return SubscriptionPlanRepository.getAll()
    }

    static async create(data: SubscriptionPlanInput) {
        return SubscriptionPlanRepository.create(data)
    }

    static async update(subscriptionPlanid: string, data: UpdateSubscriptionPlanInput) {
        if (!subscriptionPlanid) throw new AppError(`Subcription plan id required`, HttpStatus.BAD_REQUEST);

        if (!(await SubscriptionPlanRepository.getById(subscriptionPlanid))) throw new AppError(`Subcription not found.`, HttpStatus.NOT_FOUND);

        return SubscriptionPlanRepository.update(subscriptionPlanid, data)
    }

    static async delete(subscriptionPlanid: string) {
        if (!(await SubscriptionPlanRepository.getById(subscriptionPlanid))) throw new AppError(`Subcription not found.`, HttpStatus.NOT_FOUND);

        return SubscriptionPlanRepository.delete(subscriptionPlanid);
    }
}