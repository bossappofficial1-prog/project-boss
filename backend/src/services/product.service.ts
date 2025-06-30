import { ProductType } from "@prisma/client";
import { db } from "../configs/database";
import { getOutletById } from "./outlet.service";
import { AppError } from "../errors/api_errors";
import { CreateProductForOutletInput, UpdateProductInput } from "../types/product.types";

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


export async function createProductService(outletId: string, data: CreateProductForOutletInput) {
    const outlet = await getOutletById(outletId)

    if (!outlet) throw new AppError(`Outlet ${outletId} not found`, 404);

    // Memastikan quantity hanya ada untuk GOODS, dan tidak untuk SERVICE
    if (data.type === 'SERVICE' && data.quantity !== undefined && data.quantity !== null) {
        throw new AppError("Product layanan tidak boleh punya quantity", 400)
    }
    if (data.type === 'GOODS' && (data.quantity === undefined || data.quantity === null)) {
        throw new AppError("Product barang harus punya quantity", 400)
    }

    const newProduct = await db.product.create({
        data: {
            name: data.name,
            price: data.price,
            type: data.type,
            image: data.image,
            description: data.description,
            quantity: data.quantity,
            unit: data.unit,
            businessId: outlet.business.id,
            outletId
        }
    })

    return newProduct
}

export async function getProductById(productId: string) {
    const product = await db.product.findUnique({
        where: { id: productId }
    })

    if (!product) throw new AppError(`Product ${productId} not found`, 404);

    return product
}

export async function updateProductService(outletId: string, productId: string, data: UpdateProductInput) {
    const outlet = await getOutletById(outletId)

    if (!outlet) throw new AppError(`Outlet ${outletId} not found`, 404);

    const product = await getProductById(productId)

    validateProductTypeOfQuantity(data.type!, data.quantity!)
    data.quantity = data.quantity ? parseInt(data.quantity as any, 0) : undefined
    data.price = data.price ? parseInt(data.price as any, 0) : undefined
    data.costPrice = data.costPrice ? parseInt(data.costPrice as any, 0) : undefined

    const updatedProduct = await db.product.update({
        where: { id: product.id },
        data
    })

    return updatedProduct
}

export function validateProductTypeOfQuantity(type: string, quantity: string | number) {
    if (type === 'SERVICE' && quantity !== undefined && quantity !== null) {
        throw new AppError("Product layanan tidak boleh punya quantity", 400)
    }
    if (type === 'GOODS' && (quantity === undefined || quantity === null)) {
        throw new AppError("Product barang harus punya quantity", 400)
    }
}