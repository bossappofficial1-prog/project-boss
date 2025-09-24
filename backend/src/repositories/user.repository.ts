import { User } from "@prisma/client";
import { db } from "../config/prisma";

export class UserRepository {
    static async findById(id: string): Promise<any | null> {
        return await db.user.findUnique({
            where: { id },
            select: {
                name: true,
                id: true,
                email: true,
                avatar: true,
                password: true,
                role: true,
                isVerified: true,
                verificationCode: true,
                verificationCodeExpires: true,
                phone: true,
                createdAt: true,
                updatedAt: true,

                business: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        bankAccount: true,
                        bankName: true,
                        accountHolder: true,
                        defaultTransactionFeeBearer: true,
                        outlets: {
                            select: {
                                id: true,
                                name: true,
                                businessId: true,
                                address: true,
                                image: true
                            },
                            orderBy: [{ createdAt: "desc" }]
                        }
                    }
                }
            },
        });
    }

    static async findByEmail(email: string, ignoreUserId?: string): Promise<User | null> {
        return db.user.findFirst({
            where: {
                email,
                ...(ignoreUserId ?
                    { NOT: { id: ignoreUserId } }
                    : {}),
            }
        })
    }

    static async create(data: Pick<User, 'name' | 'email' | 'password' | 'verificationCode' | 'verificationCodeExpires'>): Promise<User> {
        return db.user.create({
            data,
        });
    }

    static async update(id: string, data: Partial<Pick<User, 'name' | 'password' | 'isVerified' | 'verificationCode' | 'verificationCodeExpires'>>): Promise<User> {
        return db.user.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string): Promise<User> {
        return db.user.delete({
            where: { id },
        });
    }

    static async findAll(): Promise<User[]> {
        return db.user.findMany();
    }
}