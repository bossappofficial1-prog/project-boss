import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { OnboardingService } from "../service/onboarding.service";

export const completeOnboardingController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.storedUser!.id;
        const data = req.body;

        const result = await OnboardingService.completeOnboarding(userId, data);

        return ResponseUtil.success(res, result);
    }
);

export const renewSubscriptionController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.storedUser!.id;
        const { planCode } = req.body;

        // Get business for this user
        const { BusinessRepository } = await import("../repositories/business.repository");
        const business = await BusinessRepository.findByOwnerId(userId);
        
        if (!business) {
            return ResponseUtil.error(res, "Bisnis tidak ditemukan", 404);
        }

        const result = await OnboardingService.renewSubscription(business.id, planCode);

        return ResponseUtil.success(res, result);
    }
);

export const getSubscriptionStatusController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.storedUser!.id;

        // Get business for this user
        const { BusinessRepository } = await import("../repositories/business.repository");
        const business = await BusinessRepository.findByOwnerId(userId);
        
        if (!business) {
            return ResponseUtil.error(res, "Bisnis tidak ditemukan", 404);
        }

        const result = await OnboardingService.getSubscriptionStatus(business.id);

        return ResponseUtil.success(res, result);
    }
);
