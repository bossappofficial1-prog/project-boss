import { Request, Response, NextFunction } from "express";
import { db } from "../config/prisma";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

/**
 * Middleware to check if a business has an active subscription
 * Should be applied to routes that require active subscription
 */
export async function checkActiveSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract businessId from authenticated user
    // Assuming req.user is populated by authentication middleware
    const user = (req as any).user;

    if (!user) {
      throw new AppError("User not authenticated", HttpStatus.UNAUTHORIZED);
    }

    // Get business associated with user
    const business = await db.business.findUnique({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        subscriptionPlan: true,
      },
    });

    if (!business) {
      throw new AppError("Business not found for user", HttpStatus.NOT_FOUND);
    }

    // Check if subscription is active
    if (business.subscriptionStatus !== "ACTIVE") {
      throw new AppError(
        `Subscription is ${business.subscriptionStatus}. Please contact support.`,
        HttpStatus.FORBIDDEN,
      );
    }

    // Check if subscription has expired
    if (business.subscriptionEndDate && business.subscriptionEndDate < new Date()) {
      throw new AppError(
        "Subscription has expired. Please renew your subscription.",
        HttpStatus.FORBIDDEN,
      );
    }

    // Subscription is valid, proceed
    // Optionally attach business info to request for downstream use
    (req as any).business = business;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional: Middleware to check for specific subscription plans
 * Example: checkSubscriptionPlan(['PRO', 'ENTERPRISE'])
 */
export function checkSubscriptionPlan(allowedPlans: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const business = (req as any).business;

      if (!business) {
        // Business should be populated by checkActiveSubscription middleware
        throw new AppError(
          "Business information not found. Apply checkActiveSubscription middleware first.",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!allowedPlans.includes(business.subscriptionPlan)) {
        throw new AppError(
          `This feature requires a ${allowedPlans.join(" or ")} subscription plan. Current plan: ${business.subscriptionPlan}`,
          HttpStatus.FORBIDDEN,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
