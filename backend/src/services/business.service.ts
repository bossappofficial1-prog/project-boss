import { db } from "../configs/database";
import { AppError } from "../errors/api_errors";
import { BusinessPayload } from "../types/business.types";

export async function createBusinessService(userId: string, payload: BusinessPayload) {
    const newBusiness = await db.business.create({
        data: {
            name: payload.name,
            description: payload.description,
            ownerId: userId,
            wallet: {
                create: { balance: 0 }
            },
            outlets: {
                createMany: { data: payload.outlets }
            }
        }
    })

    return newBusiness
}

export async function getAllBusiness(page: number, limit: number, search?: string) {
    const take = page * limit // banyak data yang diambil
    const skip = (page - 1) * limit

    const businesses = await db.business.findMany({
        where: search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        } : {},
        select: {
            id: true,
            name: true,
            description: true,
            outlets: {
                select: {
                    id: true,
                    name: true,
                    address: true
                }
            }
        },
        take, skip
    })

    return businesses
}

export async function getBusinessProductService(id: string) {
    const productRaw = await db.product.findMany({
        where: { businessId: id },
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            type: true,
            image: true,
            unit: true,
            Outlet: {
                select: {
                    id: true,
                    name: true,
                    address: true
                }
            }
        }
    })

    if (!productRaw || productRaw.length === 0) throw new AppError("Bisnis belum ada produk atau jasa.", 404)
    const products = productRaw.map(item => {
        const { Outlet, ...otherItems } = item
        return { ...otherItems, outlet: Outlet }
    })

    return products
}

export async function getBusinessService(id: string) {
    const business = await db.business.findFirst({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true
        }
    })

    if (!business) throw new AppError("Business not found", 404);

    return business
}

export async function getBusinessDetailService(id: string) {
    const business = await db.business.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
            outlets: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    createdAt: true,
                    // products: true
                    products: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            price: true,
                            type: true,
                            quantity: true,
                            costPrice: true,
                            unit: true
                        }
                    }
                }
            },
        }
    });

    if (!business) throw new AppError("Business not found", 404);

    return business
}