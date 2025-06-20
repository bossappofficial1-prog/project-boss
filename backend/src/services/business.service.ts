import { db } from "../configs/database";
import { AppError } from "../errors/api_errors";

export async function getAllBusiness() {
    const businesses = await db.business.findMany({
        include: {
            outlets: true,
            products: true
        }
    })

    return businesses
}

export async function getBusiness(id: string) {
    const business = await db.business.findFirst({ where: { id } })

    if (!business) throw new AppError("Business not found", 404);

    return business
}