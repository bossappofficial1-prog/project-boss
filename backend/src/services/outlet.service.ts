import { db } from "../configs/database";

export async function getAllOutletService(page: number, limit: number, search?: string) {
    const take = page * limit // banyak data yang diambil
    const skip = (page - 1) * limit
    const outlets = await db.outlet.findMany({
        where: search ? {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } }
            ]
        } : {},
        orderBy: {
            orders: { _count: "desc" }
        },
        take,
        skip
    })

    return outlets
}