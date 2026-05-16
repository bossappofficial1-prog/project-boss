import { SubscriptionStatus } from "@prisma/client";
import { redis } from "../config/redis";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import { BusinessUsageRepository } from "../repositories/business-usage.repository";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { PlanFeaturesInput } from "../schemas/subscription-plan.schema";
import { db } from "../config/prisma";
import { ProductType } from "@prisma/client";

const USAGE_CACHE_TTL_SECONDS = 60;

export type PlanUsageSnapshot = {
    outlets: UsageItem;
    products: UsageItem;
    staff: UsageItem;
    subscription: {
        status: SubscriptionStatus;
        endsAt: string | null;
    }
};

export type UsageItem = {
    limit: number;
    used: number;
    remaining: number;
    canCreate: boolean;
};

export class PlanLimitService {
    private static usageCacheKey(businessId: string) {
        return `plan-usage:${businessId}`;
    }

    static async invalidateUsageCache(businessId: string) {
        await redis.del(this.usageCacheKey(businessId));
    }

    static async assertCanCreateOutlet(businessId: string) {
        await this.assertHasQuota(businessId, "outlets");
    }

    static async assertCanCreateProduct(businessId: string) {
        await this.assertHasQuota(businessId, "products");
    }

    static async assertCanCreateStaff(businessId: string) {
        await this.assertHasQuota(businessId, "staff");
    }

    static async assertProductTypeAllowed(outletId: string, productType: ProductType) {
        const outlet = await db.outlet.findUnique({
            where: { id: outletId },
            include: {
                business: {
                    include: {
                        currentSubscription: {
                            include: { plan: true }
                        }
                    }
                }
            }
        });

        if (!outlet) throw new AppError("Outlet tidak ditemukan", HttpStatus.NOT_FOUND);

        const plan = outlet.business.subscriptionPlan;
        const isCustomAllowed = plan === 'TRIAL' || plan === 'PRO';

        // Soft enforcement: if type is CUSTOM but plan is not PRO/TRIAL, treat as FNB
        const effectiveType = (outlet.type === 'CUSTOM' && !isCustomAllowed) ? 'FNB' : outlet.type;

        const allowedTypesMap: Record<string, ProductType[]> = {
            'FNB': [ProductType.GOODS],
            'RETAIL': [ProductType.GOODS],
            'SERVICE': [ProductType.SERVICE],
            'EVENT': [ProductType.TICKET],
            'CUSTOM': [ProductType.GOODS, ProductType.SERVICE, ProductType.TICKET]
        };

        const allowed = allowedTypesMap[effectiveType] || [ProductType.GOODS];
        if (!allowed.includes(productType)) {
            throw new AppError(
                `Tipe produk ${productType} tidak didukung oleh tipe outlet Anda pada paket langganan saat ini (${plan}).`,
                HttpStatus.FORBIDDEN
            );
        }
    }

    static async assertSubscriptionActive(businessId: string) {
        const context = await SubscriptionRepository.getBusinessWithCurrentSubscription(businessId);
        if (!context) {
            throw new AppError("Bisnis tidak ditemukan", HttpStatus.NOT_FOUND);
        }

        if (!context.currentSubscription || !context.currentSubscription.plan) {
            throw new AppError("Langganan belum aktif. Silakan lengkapi pembayaran terlebih dahulu.", HttpStatus.FORBIDDEN);
        }

        if (![SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL].includes(context.subscriptionStatus as any)) {
            throw new AppError("Langganan Anda tidak aktif. Silakan perpanjang atau hubungi admin.", HttpStatus.FORBIDDEN);
        }

        if (context.subscriptionEndDate && new Date(context.subscriptionEndDate) < new Date()) {
            throw new AppError("Langganan Anda telah berakhir. Silakan lakukan perpanjangan.", HttpStatus.FORBIDDEN);
        }

        return context;
    }

    static async getUsageSnapshot(businessId: string, options?: { allowInactive?: boolean }): Promise<PlanUsageSnapshot> {
        const useCache = !options?.allowInactive;
        const cacheKey = this.usageCacheKey(businessId);
        if (useCache) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached) as PlanUsageSnapshot;
            }
        }

        const context = options?.allowInactive
            ? await SubscriptionRepository.getBusinessWithCurrentSubscription(businessId)
            : await this.assertSubscriptionActive(businessId);

        if (!context) {
            throw new AppError("Bisnis tidak ditemukan", HttpStatus.NOT_FOUND);
        }

        if (!context.currentSubscription || !context.currentSubscription.plan) {
            throw new AppError("Tidak ada paket langganan yang aktif untuk bisnis ini", HttpStatus.BAD_REQUEST);
        }

        const planFeatures = this.parsePlanFeatures(context.currentSubscription.plan.features);

        const [outlets, products, staff] = await Promise.all([
            BusinessUsageRepository.countOutletsByBusiness(businessId),
            BusinessUsageRepository.countProductsByBusiness(businessId),
            BusinessUsageRepository.countStaffByBusiness(businessId),
        ]);

        const usage: PlanUsageSnapshot = {
            outlets: this.buildUsageItem(outlets, planFeatures.maxOutlets),
            products: this.buildUsageItem(products, planFeatures.maxProducts),
            staff: this.buildUsageItem(staff, planFeatures.maxStaff),
            subscription: {
                status: context.subscriptionStatus,
                endsAt: context.subscriptionEndDate ? new Date(context.subscriptionEndDate).toISOString() : null,
            },
        };

        if (useCache) {
            await redis.set(cacheKey, JSON.stringify(usage), "EX", USAGE_CACHE_TTL_SECONDS);
        }
        return usage;
    }

    private static async assertHasQuota(businessId: string, resource: keyof PlanUsageSnapshot) {
        const usage = await this.getUsageSnapshot(businessId);
        const target = usage[resource as "outlets" | "products" | "staff"] as UsageItem;
        if (!target.canCreate) {
            const label = this.getResourceLabel(resource);
            throw new AppError(`Batas ${label} pada paket langganan Anda sudah tercapai`, HttpStatus.FORBIDDEN);
        }
    }

    private static getResourceLabel(resource: keyof PlanUsageSnapshot) {
        switch (resource) {
            case "outlets":
                return "outlet";
            case "products":
                return "product";
            case "staff":
                return "staff";
            default:
                return resource;
        }
    }

    private static buildUsageItem(used: number, limit: number): UsageItem {
        if (limit === -1) {
            return {
                limit,
                used,
                remaining: -1,
                canCreate: true,
            };
        }

        const remaining = Math.max(limit - used, 0);
        return {
            limit,
            used,
            remaining,
            canCreate: remaining > 0,
        };
    }

    private static parsePlanFeatures(features: any): PlanFeaturesInput {
        if (!features) {
            throw new AppError("Fitur paket langganan tidak ditemukan", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (typeof features === "object") {
            return features as PlanFeaturesInput;
        }

        try {
            return JSON.parse(features as string) as PlanFeaturesInput;
        } catch (error) {
            throw new AppError("Format fitur paket langganan tidak valid", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
