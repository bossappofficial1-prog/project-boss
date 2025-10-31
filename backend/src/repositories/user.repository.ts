import { User } from "@prisma/client";
import { db } from "../config/prisma";

export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface SafeUser {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: User['role'];
    isVerified: boolean;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
}

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
                                image: true,
                                description: true,
                                isOpen: true,
                                latitude: true,
                                longitude: true,
                                manualAccountHolder: true,
                                manualBankAccount: true,
                                manualBankName: true,
                                manualPaymentNote: true,
                                manualQrImageUrl: true,
                                phone: true,
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

    static async createGoogleUser(data: Pick<User, 'name' | 'email' | 'password' | 'googleId' | 'provider' | 'isVerified' | 'role'>): Promise<User> {
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

    static async findAllPaginated(params: PaginationParams): Promise<PaginatedResult<SafeUser>> {
        const {
            page = 1,
            limit = 10,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = params;

        const skip = (page - 1) * limit;

        // Build where clause for search
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
                { phone: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {};

        // Build orderBy clause
        const orderBy = { [sortBy]: sortOrder };

        // Get total count
        const total = await db.user.count({ where });

        // Get paginated data
        const data = await db.user.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isVerified: true,
                avatar: true,
                createdAt: true,
                updatedAt: true
            }
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };
    }

    static async findByGoogleId(googleId: string): Promise<User | null> {
        return db.user.findUnique({
            where: { googleId },
        });
    }
}