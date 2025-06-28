import { Role } from "@prisma/client";
import { db } from "../configs/database";
import { AppError } from "../errors/api_errors";

export async function checkIfEmailExists(email: string, ignoredId?: string) {
    const where: any = { email }

    if (ignoredId) { where.NOT = { id: ignoredId } }

    const existsEmail = await db.user.findFirst({ where })

    return existsEmail ? true : false
}

export async function getUserByEmail(email: string) {
    const user = await db.user.findFirst({
        where: { email }
    })

    return user
}

export async function createUser(data: {
    email: string,
    name: string,
    password: string,
    verificationCode?: string,
    verificationCodeExpires?: string | Date
}) {
    const check = await checkIfEmailExists(data.email)

    if (check) throw new AppError(`Email '${data.email}' sudah terdaftar`, 400)
    const newUser = await db.user.create({ data })

    return newUser
}

export async function getUserById(id: string) {
    const user = await db.user.findFirst({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            isVerified: true,
            businesses: { select: { id: true, name: true } },
            createdAt: true,
            updatedAt: true
        }
    })

    if (!user) throw new AppError('User not found', 404);

    return user
}

export async function deleteUser(id: string) {
    await getUserById(id)
    const deletedUser = await db.user.delete({ where: { id } })
    return deletedUser
}

export async function updateUserService(id: string, data: {
    avatar?: string,
    isVerified?: boolean,
    name?: string,
    password?: string,
    email?: string,
    role?: Role,
    verificationCode?: string | null,
    verificationCodeExpires?: Date | null,

}) {
    await getUserById(id)

    const updateUser = await db.user.update({
        where: { id },
        data
    })

    return updateUser
}