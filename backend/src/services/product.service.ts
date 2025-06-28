import { ProductType } from "@prisma/client";
import { db } from "../configs/database";
import { getOutletById } from "./outlet.service";

export async function getProductOutletService(
    outletId: string,
    filter: {
        page: number;
        limit: number;
        search?: string;
    }
) {
    await getOutletById(outletId);

    const take = filter.page * filter.limit // banyak data yang diambil
    const skip = (filter.page - 1) * filter.limit

    let where: any = { outletId }

    if (filter.search) {
        const search = filter.search.toLocaleLowerCase()
        const isNumeric = !isNaN(Number(search))
        const isTypeOfProductType = Object.values(ProductType).includes(search.toUpperCase() as ProductType)

        where = {
            OR: [
                { name: { contains: filter.search, mode: "insensitive" } },
                { ...isNumeric ? { price: { gte: Number(search) } } : {} },
                { ...isTypeOfProductType ? { type: { equals: search.toUpperCase() } } : {} }
            ]
        }
    }

    const products = await db.product.findMany({
        take, skip,
        orderBy: { price: "asc" },
        where,
        select: {
            id: true,
            name: true,
            description: true,
            quantity: true,
            price: true,
            image: true,
            type: true,
            unit: true,
        },
    });

    const count = await db.product.count({ where: { outletId } })
    return { products, count };
}

export async function getProductByType(outletId: string, productType: ProductType) {
    const outlet = await getOutletById(outletId)

    const products = await db.product.findMany({
        where: {
            AND: [
                { outletId: outlet.id },
                { type: productType }
            ]
        }
    })

    return products
}