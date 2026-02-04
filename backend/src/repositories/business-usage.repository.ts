import { db } from "../config/prisma";

export class BusinessUsageRepository {
    static countOutletsByBusiness(businessId: string) {
        return db.outlet.count({
            where: { businessId },
        });
    }

    static countProductsByBusiness(businessId: string) {
        return db.product.count({
            where: {
                outlet: {
                    businessId,
                },
            },
        });
    }

    static countStaffByBusiness(businessId: string) {
        return db.staff.count({
            where: {
                outlet: {
                    businessId,
                },
            },
        });
    }
}
