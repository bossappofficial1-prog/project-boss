import { db } from "../config/prisma";
import { UserRole } from "@prisma/client";

export async function getHomeSummaryService(searchQuery?: string) {
    const umkmPromise = db.user.count({
        where: {
            role: UserRole.OWNER,
            isVerified: true,
        },
    });

    const transactionsPromise = db.transaction.count({
        where: {
            status: "SUCCESS",
        },
    });

    const membershipsPromise = db.membership.count({
        where: {
            isActive: true
        }
    });

    let outletsPromise;

    if (searchQuery) {
        outletsPromise = db.outlet.findMany({
            where: {
                OR: [
                    { name: { contains: searchQuery, mode: 'insensitive' } },
                    { business: { name: { contains: searchQuery, mode: 'insensitive' } } }
                ]
            },
            take: 6,
            include: {
                business: {
                    select: { name: true }
                }
            }
        });
    } else {
        outletsPromise = db.outlet.findMany({
            take: 6,
            include: {
                business: {
                    select: { name: true }
                }
            },
            orderBy: {
                orders: {
                    _count: 'desc'
                }
            }
        });
    }

    const [umkm, transactions, memberships, outlets] = await Promise.all([
        umkmPromise,
        transactionsPromise,
        membershipsPromise,
        outletsPromise
    ]);

    return {
        umkm,
        transactions,
        memberships,
        outlets
    };
}