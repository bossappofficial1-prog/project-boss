import { db } from "../config/prisma";

export class BannerRepository {

    static async findActiveBanners(limit = 10) {
        return db.banner.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            take: limit,
        });
    }

    static async findAllBanner() {
        return db.banner.findMany({
            orderBy: { sortOrder: `asc` }
        })
    }

    static async create(data: { title: string; subtitle?: string; imageUrl: string; ctaType?: string; ctaPayload?: string; sortOrder?: number; businessId?: string }) {
        return db.banner.create({ data });
    }

    static async update(id: string, data: Partial<{ title: string; subtitle?: string; imageUrl: string; ctaType?: string; ctaPayload?: string; sortOrder?: number; isActive?: boolean }>) {
        return db.banner.update({ where: { id }, data });
    }

    static async remove(id: string) {
        return db.banner.delete({ where: { id } });
    }
}
