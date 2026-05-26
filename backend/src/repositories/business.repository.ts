import { $Enums, Business } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateBusinessInput, UpdateBusinessInput } from "../schemas/business.schema";
import { generateBusinessId } from "../utils";

export class BusinessRepository {
    static async create(data: CreateBusinessInput, ownerId: string): Promise<Business> {
        const { defaultTransactionFeeBearer, ...cleanData } = data
        return db.business.create({
            data: {
                ...cleanData,
                ownerId,
                id: generateBusinessId()
            },
        });
    }

    static async getExpiredBusinessSubscriptionsCandidate() {
        return db.business.findMany({
            where: {
                AND: [
                    { subscriptionEndDate: { lte: new Date(Date.now()) } },
                    { subscriptionStatus: { notIn: ['EXPIRED', 'SUSPENDED'] } }
                ]
            },
            select: { id: true }
        })
    }

    static async markBusinessSubscriptionsAsExpired(businessIds: string[]) {
        return db.$transaction(async (tx) => {
            for (const id of businessIds) {
                const business = await tx.business.update({
                    where: { id },
                    data: {
                        subscriptionStatus: 'EXPIRED',
                    },
                    select: { currentSubscriptionId: true }
                })

                if (business.currentSubscriptionId) {
                    await tx.businessSubscription.update({
                        where: { id: business.currentSubscriptionId },
                        data: {
                            status: 'EXPIRED',
                        }
                    })
                }
            }
        })
    }

    static async findByOwnerId(ownerId: string): Promise<Business | null> {
        return db.business.findUnique({
            where: { ownerId },
        });
    }

    static async findById(id: string): Promise<Business | null> {
        return db.business.findUnique({
            where: { id },
        });
    }

    static async findAll(): Promise<Business[]> {
        return db.business.findMany();
    }

    static async findAllActiveWithOwnerAndOutlets() {
        return db.business.findMany({
            where: {
                subscriptionStatus: {
                    not: 'SUSPENDED'
                }
            },
            include: {
                owner: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                outlets: true
            }
        });
    }

    static async findByName(name: string, excludeId?: string): Promise<Business | null> {
        return db.business.findFirst({
            where: {
                name,
                ...(excludeId && { id: { not: excludeId } }),
            },
        });
    }

    static async update(id: string, data: Omit<UpdateBusinessInput, 'defaultTransactionFeeBearer'>): Promise<Business> {
        return db.business.update({
            where: { id },
            data,
        });
    }

    // admin

    static async findAllBusiness(params?:
        {
            name?: string,
            status?: $Enums.SubscriptionStatus
        }) {
        return db.business.findMany({
            where: {
                ...(params?.name && params.name !== '' && {
                    name: {
                        contains: params.name,
                        mode: 'insensitive',
                    },
                }),
                ...(params?.status && {
                    subscriptionStatus: params.status,
                }),
            },
            select: {
                id: true,
                name: true,
                subscriptionEndDate: true,
                subscriptionPlan: true,
                subscriptionStatus: true,
                createdAt: true,
                owner: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    }

    static async getKPIs() {
        const today = new Date()

        const startOfLastMonth = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1,
            0, 0, 0, 0
        )

        const endOfLastMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            0,
            23, 59, 59, 999
        )

        const startOfThisMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1,
            0, 0, 0, 0
        )
        const startOfNextMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            1,
            0, 0, 0, 0
        )

        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        const endOfNext7Days = new Date(startOfToday)
        endOfNext7Days.setDate(startOfToday.getDate() + 7)


        const [totalMerchants, totalLastMonth, totalMerchantThisMonth, totalMerchantSuspend, totalIncommingMerchantExpire] = await Promise.all([
            db.business.count(),
            db.business.count({
                where: {
                    createdAt: {
                        gte: startOfLastMonth,
                        lt: endOfLastMonth,
                    },
                },
            }),
            db.business.count({
                where: {
                    createdAt: {
                        gte: startOfThisMonth,
                        lt: startOfNextMonth
                    }
                }
            }),
            db.business.count({
                where: { subscriptionStatus: 'SUSPENDED' }
            }),
            db.business.count({
                where: {
                    subscriptionEndDate: {
                        gte: startOfToday,
                        lt: endOfNext7Days,
                    },
                },
            })
        ]);

        return { totalMerchants, totalLastMonth, totalMerchantThisMonth, totalMerchantSuspend, totalIncommingMerchantExpire }
    }

    static async completeRegister() {
        return db.business.create({
            data: {
                name: ``,
                ownerId: ``
            }
        })
    }
}