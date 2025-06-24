import { db } from "../configs/database";
import { AppError } from "../errors/api_errors";

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
    const products = await db.product.findMany({
        where: { businessId: id },
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            type: true
        }
    })

    if (!products || products.length === 0) throw new AppError("Bisnis belum ada produk atau jasa.", 404)

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
                    address: true
                }
            },
            products: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    type: true
                }
            }
        }
    });

    if (!business) throw new AppError("Business not found", 404);

    return business
}