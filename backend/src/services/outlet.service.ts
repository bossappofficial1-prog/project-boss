import { db } from "../configs/database";
import { AppError } from "../errors/api_errors";

export async function getAllOutletService(page: number, limit: number, search?: string) {
    const take = page * limit // banyak data yang diambil
    const skip = (page - 1) * limit

    const count = await db.outlet.count()
    const outlets = await db.outlet.findMany({
        where: search ? {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } }
            ]
        } : {},
        select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            image: true,
            business: { select: { name: true } },
            createdAt: true,
            updatedAt: true
        },
        orderBy: {
            orders: { _count: "desc" }
        },
        take,
        skip
    })

    const outletMap = outlets.map((outlet) => {
        const { business, ...others } = outlet
        return { ...others, business_name: outlet.business.name }
    })

    return { outlets: outletMap, count }
}

export async function getOutletById(id: string) {
    const outlet = await db.outlet.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            image: true,
            business: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                }
            }
        }
    })

    if (!outlet) throw new AppError(`Outlet for id: ${id} not found`, 404);

    return outlet
}