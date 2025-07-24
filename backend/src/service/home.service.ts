import { db } from "../config/prisma";
import { UserRole } from "@prisma/client";

export async function getHomeSummaryService() {
    const totalUmkm = await db.user.count({
        where: {
            role: UserRole.OWNER,
        },
    });

    const totalTransaction = await db.transaction.count({
        where: {
            status: "SUCCESS",
        },
    });

    const totalMembership = await db.membership.count();

    return {
        totalUmkm,
        totalTransaction,
        totalMembership,
    };
}