import { Request, Response, NextFunction } from "express";
import { db } from "../config/prisma";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

interface SubscriptionFeatures {
    maxOutlets: number; // -1 means unlimited
    maxProducts: number; // -1 means unlimited
    maxStaff: number; // -1 means unlimited
    canExportReport: boolean;
    supportLevel: 'EMAIL' | 'WHATSAPP' | 'PRIORITY';
}

/**
 * Middleware to check if owner can create a new outlet
 */
export async function checkOutletLimit(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as any).storedUser;
        
        if (!user) {
            throw new AppError("User not authenticated", HttpStatus.UNAUTHORIZED);
        }

        // Get business with subscription details
        const business = await db.business.findUnique({
            where: { ownerId: user.id },
            include: {
                currentSubscription: {
                    include: {
                        plan: true,
                    },
                },
                outlets: {
                    select: { id: true },
                },
            },
        });

        if (!business) {
            throw new AppError("Business not found", HttpStatus.NOT_FOUND);
        }

        // Check if subscription is active
        if (business.subscriptionStatus !== "ACTIVE" && business.subscriptionStatus !== "TRIAL") {
            throw new AppError(
                "Subscription tidak aktif. Silakan perpanjang langganan Anda.",
                HttpStatus.FORBIDDEN
            );
        }

        // Get plan features
        const features = business.currentSubscription?.plan.features as SubscriptionFeatures;
        
        if (!features) {
            throw new AppError("Plan features not found", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Check outlet limit
        if (features.maxOutlets !== -1 && business.outlets.length >= features.maxOutlets) {
            throw new AppError(
                `Limit outlet untuk paket ${business.subscriptionPlan} adalah ${features.maxOutlets}. Upgrade paket untuk menambah outlet.`,
                HttpStatus.FORBIDDEN
            );
        }

        // Attach business to request for downstream use
        (req as any).business = business;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Middleware to check if owner can create a new product
 */
export async function checkProductLimit(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as any).storedUser;
        
        if (!user) {
            throw new AppError("User not authenticated", HttpStatus.UNAUTHORIZED);
        }

        // Get outlet ID from request
        const outletId = req.body.outletId || req.params.outletId;
        
        if (!outletId) {
            throw new AppError("Outlet ID required", HttpStatus.BAD_REQUEST);
        }

        // Get outlet with business and products
        const outlet = await db.outlet.findUnique({
            where: { id: outletId },
            include: {
                business: {
                    include: {
                        currentSubscription: {
                            include: {
                                plan: true,
                            },
                        },
                        outlets: {
                            include: {
                                products: {
                                    select: { id: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!outlet) {
            throw new AppError("Outlet not found", HttpStatus.NOT_FOUND);
        }

        const business = outlet.business;

        // Check ownership
        if (business.ownerId !== user.id) {
            throw new AppError("You don't have permission", HttpStatus.FORBIDDEN);
        }

        // Check if subscription is active
        if (business.subscriptionStatus !== "ACTIVE" && business.subscriptionStatus !== "TRIAL") {
            throw new AppError(
                "Subscription tidak aktif. Silakan perpanjang langganan Anda.",
                HttpStatus.FORBIDDEN
            );
        }

        // Get plan features
        const features = business.currentSubscription?.plan.features as SubscriptionFeatures;
        
        if (!features) {
            throw new AppError("Plan features not found", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Count total products across all outlets
        const totalProducts = business.outlets.reduce((sum, o) => sum + o.products.length, 0);

        // Check product limit
        if (features.maxProducts !== -1 && totalProducts >= features.maxProducts) {
            throw new AppError(
                `Limit produk untuk paket ${business.subscriptionPlan} adalah ${features.maxProducts}. Upgrade paket untuk menambah produk.`,
                HttpStatus.FORBIDDEN
            );
        }

        // Attach business to request
        (req as any).business = business;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Middleware to check if owner can create a new staff
 */
export async function checkStaffLimit(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as any).storedUser;
        
        if (!user) {
            throw new AppError("User not authenticated", HttpStatus.UNAUTHORIZED);
        }

        // Get outlet ID from request
        const outletId = req.body.outletId || req.params.outletId;
        
        if (!outletId) {
            throw new AppError("Outlet ID required", HttpStatus.BAD_REQUEST);
        }

        // Get outlet with business and staff
        const outlet = await db.outlet.findUnique({
            where: { id: outletId },
            include: {
                business: {
                    include: {
                        currentSubscription: {
                            include: {
                                plan: true,
                            },
                        },
                        outlets: {
                            include: {
                                staff: {
                                    select: { id: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!outlet) {
            throw new AppError("Outlet not found", HttpStatus.NOT_FOUND);
        }

        const business = outlet.business;

        // Check ownership
        if (business.ownerId !== user.id) {
            throw new AppError("You don't have permission", HttpStatus.FORBIDDEN);
        }

        // Check if subscription is active
        if (business.subscriptionStatus !== "ACTIVE" && business.subscriptionStatus !== "TRIAL") {
            throw new AppError(
                "Subscription tidak aktif. Silakan perpanjang langganan Anda.",
                HttpStatus.FORBIDDEN
            );
        }

        // Get plan features
        const features = business.currentSubscription?.plan.features as SubscriptionFeatures;
        
        if (!features) {
            throw new AppError("Plan features not found", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Count total staff across all outlets
        const totalStaff = business.outlets.reduce((sum, o) => sum + o.staff.length, 0);

        // Check staff limit
        if (features.maxStaff !== -1 && totalStaff >= features.maxStaff) {
            throw new AppError(
                `Limit staff untuk paket ${business.subscriptionPlan} adalah ${features.maxStaff}. Upgrade paket untuk menambah staff.`,
                HttpStatus.FORBIDDEN
            );
        }

        // Attach business to request
        (req as any).business = business;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Middleware to check if owner can export reports
 */
export async function checkReportExportPermission(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as any).storedUser;
        
        if (!user) {
            throw new AppError("User not authenticated", HttpStatus.UNAUTHORIZED);
        }

        // Get business with subscription details
        const business = await db.business.findUnique({
            where: { ownerId: user.id },
            include: {
                currentSubscription: {
                    include: {
                        plan: true,
                    },
                },
            },
        });

        if (!business) {
            throw new AppError("Business not found", HttpStatus.NOT_FOUND);
        }

        // Check if subscription is active
        if (business.subscriptionStatus !== "ACTIVE" && business.subscriptionStatus !== "TRIAL") {
            throw new AppError(
                "Subscription tidak aktif. Silakan perpanjang langganan Anda.",
                HttpStatus.FORBIDDEN
            );
        }

        // Get plan features
        const features = business.currentSubscription?.plan.features as SubscriptionFeatures;
        
        if (!features) {
            throw new AppError("Plan features not found", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Check export permission
        if (!features.canExportReport) {
            throw new AppError(
                `Fitur export laporan tidak tersedia di paket ${business.subscriptionPlan}. Upgrade paket untuk menggunakan fitur ini.`,
                HttpStatus.FORBIDDEN
            );
        }

        // Attach business to request
        (req as any).business = business;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Get current usage statistics for the business
 */
export async function getUsageStatistics(businessId: string) {
    const business = await db.business.findUnique({
        where: { id: businessId },
        include: {
            currentSubscription: {
                include: {
                    plan: true,
                },
            },
            outlets: {
                include: {
                    products: true,
                    staff: true,
                },
            },
        },
    });

    if (!business) {
        throw new AppError("Business not found", HttpStatus.NOT_FOUND);
    }

    const features = business.currentSubscription?.plan.features as SubscriptionFeatures;

    const totalOutlets = business.outlets.length;
    const totalProducts = business.outlets.reduce((sum, o) => sum + o.products.length, 0);
    const totalStaff = business.outlets.reduce((sum, o) => sum + o.staff.length, 0);

    return {
        usage: {
            outlets: totalOutlets,
            products: totalProducts,
            staff: totalStaff,
        },
        limits: {
            outlets: features?.maxOutlets ?? -1,
            products: features?.maxProducts ?? -1,
            staff: features?.maxStaff ?? -1,
        },
        plan: business.subscriptionPlan,
        status: business.subscriptionStatus,
        endDate: business.subscriptionEndDate,
    };
}
