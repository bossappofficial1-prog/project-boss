import { db } from "../configs/database";
import { AppError } from "../errors/api_errors";
import { getUserById } from "./user.service";

export async function getBusinessWalletService(userId: string) {
    const user = await getUserById(userId)
    const businessId = user.business?.id

    if (!user || !user.business) {
        throw new AppError("User tidak memiliki bisnis", 404)
    }

    const wallet = await db.wallet.findUnique({
        where: { businessId },
        select: {
            id: true,
            balance: true,
        }
    })

    if (!wallet) throw new AppError(`user ${user.name} bukan pelaku bisnis atau belum bisnis.`)

    return wallet
}