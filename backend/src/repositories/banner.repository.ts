import { db } from "../config/prisma";
import { bulkOrderSValues } from "../schemas/banner.schema";

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

    static async bulkUpdate(payload: bulkOrderSValues) {
        if (payload.length === 0) return 0;

        const cases = payload
            .map(
                (_, i) =>
                    `WHEN id = $${i * 2 + 1} THEN $${i * 2 + 2}::INTEGER`
            )
            .join(" ");

        const ids = payload
            .map((_, i) => `$${i * 2 + 1}`)
            .join(", ");

        const values = payload.flatMap((p) => [p.id, p.order]);

        const query = `
            UPDATE "Banner"
            SET "sortOrder" = CASE
            ${cases}
            END
            WHERE id IN (${ids})
        `;

        return db.$executeRawUnsafe(query, ...values);
    }

    static async remove(id: string) {
        return db.banner.delete({ where: { id } });
    }
}
