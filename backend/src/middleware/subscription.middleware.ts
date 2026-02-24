import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./error.middleware";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { PlanLimitService } from "../service/plan-limit.service";

export const requireActiveSubscription = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const businessId = req.storedUser?.businessId;

    if (!businessId) {
        throw new AppError("Bisnis tidak ditemukan pada sesi Anda", HttpStatus.FORBIDDEN);
    }

    const context = await PlanLimitService.assertSubscriptionActive(businessId);
    req.subscriptionContext = context;
    next();
});

export const requireSubscriptionPlan = (allowedPlans: string[]) =>
    asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
        const businessId = req.storedUser?.businessId;

        if (!businessId) {
            throw new AppError("Bisnis tidak ditemukan pada sesi Anda", HttpStatus.FORBIDDEN);
        }

        const context = req.subscriptionContext ?? (await PlanLimitService.assertSubscriptionActive(businessId));
        if (!allowedPlans.includes(context.currentSubscription?.plan?.code ?? "")) {
            throw new AppError(
                `Fitur ini memerlukan paket ${allowedPlans.join(" atau ")}. Paket Anda saat ini: ${context.currentSubscription?.plan?.code ?? "-"}`,
                HttpStatus.FORBIDDEN,
            );
        }

        req.subscriptionContext = context;
        next();
    });
