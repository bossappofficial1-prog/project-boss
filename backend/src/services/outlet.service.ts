import { db } from "../configs/database";
import { AppError } from "../errors/api_errors";
import { getBusinessByIdService } from "./business.service";

export async function getAllOutletService(page: number, limit: number, search?: string) {
    const take = page * limit // banyak data yang diambil
    const skip = (page - 1) * limit

    const whereCondition: any = search ? {
        OR: [
            { name: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            {
                business: {
                    name: { contains: search, mode: "insensitive" }
                }
            }
        ]
    } : {};

    const count = await db.outlet.count({ where: whereCondition! })
    const outlets = await db.outlet.findMany({
        where: search ? {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } },
                {
                    business: {
                        name: { contains: search, mode: "insensitive" }
                    }
                }
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
            updatedAt: true,
            _count: { select: { products: true } }
        },
        orderBy: {
            orders: { _count: "desc" }
        },
        take,
        skip
    })

    const outletMap = outlets.map((outlet) => {
        const { business, _count, ...others } = outlet
        return { ...others, product_count: _count.products, business_name: outlet.business.name }
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

export async function getOutletDashboardService(outletId: string) {
    const outlet = await getOutletById(outletId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // ambil banyak order hari ini
    const totalOrderToday = await db.order.count({
        where: {
            outletId: outlet.id,
            createdAt: {
                gte: today
            }
        }
    })

    // ambil banya pendapatan hari ini
    const incomeAgg = await db.order.aggregate({
        where: {
            outletId: outlet.id,
            paymentStatus: "SETTLEMENT",
            createdAt: { gte: today }
        },
        _sum: { totalAmount: true }
    })

    const totalIncomeToday = incomeAgg._sum.totalAmount ?? 0

    // ambil banyak produk untuk outlet ini
    const totalProducts = await db.product.count({
        where: { outletId: outlet.id }
    })

    // ambil produk yang stoknya <= 0
    const outOfStockProducts = await db.product.findMany({
        where: {
            outletId: outlet.id,
            quantity: { lte: 0 },
            type: "GOODS"
        },
        select: {
            name: true,
            quantity: true
        }
    })

    // ambil banya pengeluaran bulan ini
    const expenseAgg = await db.expense.aggregate({
        where: {
            outletId: outlet.id,
            date: { gte: startOfMonth }
        },
        _sum: { amount: true }
    })
    const monthlyExpense = expenseAgg._sum.amount ?? 0

    // jumlah order per status
    const orderStatusRaw = await db.order.groupBy({
        by: ["queueStatus"],
        where: { outletId },
        _count: true
    });
    const orderStatusSummary = orderStatusRaw.map(item => ({
        queueStatus: item.queueStatus,
        count: item._count
    }))

    // ambil 5 produk terlaris
    const topProducts = await db.orderItem.groupBy({
        by: ["productId"],
        where: {
            product: { outletId: outlet.id }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5
    })

    const bestSellingProducts = await Promise.all(
        topProducts.map(async item => {
            const product = await db.product.findUnique({
                where: { id: item.productId },
                select: { name: true }
            })

            return {
                name: product?.name ?? "Unknown Product",
                sold: item._sum.quantity
            }
        })
    )

    return {
        totalOrderToday,
        totalIncomeToday,
        totalProducts,
        outOfStockProducts,
        monthlyExpense,
        orderStatusSummary,
        bestSellingProducts
    }
}

export async function createOutletService(businessId: string, data: {
    name: string,
    address: string,
    image: string,
    phone: string,
}) {
    const business = await getBusinessByIdService(businessId)

    if (!business) throw new AppError(`Business id: ${businessId} not found`);

    const newOutlet = await db.outlet.create({
        data: {
            name: data.name,
            address: data.address,
            image: data.image,
            phone: data.phone,
            businessId,
        }
    })

    return newOutlet
}