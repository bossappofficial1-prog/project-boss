import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { UserRepository, PaginationParams, PaginatedResult, SafeUser } from "../repositories/user.repository";
import { createUserByAdminInput, CreateUserInput, UpdateUserInput } from "../schemas/user.schema";
import { UserMe } from "../types/Others";
import { BcryptUtil } from "../utils";
import { randomUUID } from "crypto";
import { CodeGeneratorUtil, DateUtil } from "../utils";
import { messagePublisher } from "./message-publisher.service";
import { UserRole } from "@prisma/client";

export async function getAllUserService(params?: PaginationParams): Promise<PaginatedResult<SafeUser>> {
    if (params) {
        return await UserRepository.findAllPaginated(params);
    }

    // Fallback for non-paginated requests (maintain backward compatibility)
    const users = await UserRepository.findAll();
    const safeUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        business: user.business?.id,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }));

    return {
        data: safeUsers,
        page: 1,
        limit: safeUsers.length,
        total: safeUsers.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    };
}

export async function getUserByIdService(userId: string) {
    const user = await UserRepository.findById(userId) as UserMe
    if (!user) throw new AppError(Messages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return { ...user, password: '[REDACTED]' }
}

export async function getUserDetailService(userId: string) {
    const user = await UserRepository.detail(userId)
    if (!user) throw new AppError(Messages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    const subscriptionEndDate = new Date(user.business?.subscriptionEndDate!);
    const today = new Date()
    const subscriptionExpire = subscriptionEndDate.getTime() > today.getTime()

    const result = {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            isVerified: user.isVerified,
        },
        business: {
            id: user.business?.id,
            name: user.business?.name,
            description: user.business?.description,
            bankInfo: {
                bankName: user.business?.bankName,
                bankAccount: user.business?.bankAccount,
                accountHolder: user.business?.accountHolder,
            },
            config: {
                feeBearer: '',
                totalOutlets: user.business?._count.outlets,
                totalMembers: 0,
                subscriptionStartDate: user.business?.subscriptionStartDate,
                subscriptionEndDate: user.business?.subscriptionEndDate,
                subscribetionPlan: user.business?.subscriptionPlan,
                isExpire: subscriptionExpire
            },
        },
        wallet: {
            balance: 0,
            pendingWithdrawal: 500000
        },
        recentActivity: {
            lastWithdrawal: "2024-03-15T10:00:00Z",
            lastWithdrawalStatus: "COMPLETED"
        }
    }
    return result
}

export async function getUserByEmailService(email: string, ignoreUserId?: string) {
    const user = await UserRepository.findByEmail(email, ignoreUserId)

    return user
}

export async function createUserService(data: CreateUserInput, actor?: UserRole) {
    data.password = (await BcryptUtil.hash(data.password))!

    const verificationCode = CodeGeneratorUtil.generate(6);
    const verificationCodeExpires = DateUtil.addMinutes(new Date(), 10); // Code expires in 10 minutes

    const user = await UserRepository.create({
        ...data,
        ...(actor === 'ADMIN' ? { isVerified: true } : {
            verificationCode,
            verificationCodeExpires,
        }),
    });

    if (actor !== 'ADMIN') {
        await messagePublisher.publishSendVerificationEmail(user.email, verificationCode);
    }

    return { ...user, password: '[REDACTED]' }
}

export async function verifyUserService(email: string, code: string) {
    const user = await getUserByEmailService(email);

    if (!user) {
        throw new AppError("Pengguna tidak ditemukan.", HttpStatus.NOT_FOUND);
    }

    if (user.isVerified) {
        throw new AppError("Akun sudah terverifikasi.", HttpStatus.BAD_REQUEST);
    }

    const now = new Date();
    if (!user.verificationCode || !user.verificationCodeExpires || now > user.verificationCodeExpires) {
        throw new AppError("Kode verifikasi tidak valid atau sudah kedaluwarsa.", HttpStatus.BAD_REQUEST);
    }

    if (user.verificationCode !== code) {
        throw new AppError("Kode verifikasi salah.", HttpStatus.BAD_REQUEST);
    }

    const updatedUser = await UserRepository.update(user.id, {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
    });

    return { ...updatedUser, password: '[REDACTED]' };
}

export async function updateUserService(userId: string, data: UpdateUserInput) {
    await getUserByIdService(userId)
    if (data && data.password) {
        data.password = (await BcryptUtil.hash(data.password))!
    }

    const user = await UserRepository.update(userId, data)

    return { ...user, password: '[REDACTED]' }
}

export async function deleteUserService(userId: string) {
    await getUserByIdService(userId)

    const user = await UserRepository.delete(userId)

    return { ...user, password: '[REDACTED]' }
}

export async function updateUserPasswordService(userId: string, newPassword: string) {
    const hashedPassword = await BcryptUtil.hash(newPassword);
    const user = await UserRepository.update(userId, { password: hashedPassword });
    return { ...user, password: '[REDACTED]' };
}

export async function createUserWithGoogleService(googleProfile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
}) {
    // Check if user with this email already exists
    const existingUser = await getUserByEmailService(googleProfile.email);
    if (existingUser) {
        throw new AppError("Email sudah terdaftar dengan akun lain.", HttpStatus.CONFLICT);
    }

    // Create new user with Google data
    const user = await UserRepository.createGoogleUser({
        email: googleProfile.email,
        name: googleProfile.name,
        password: await BcryptUtil.hash(randomUUID()),
        googleId: googleProfile.googleId,
        avatar: googleProfile.avatar || null,
        provider: 'google',
        isVerified: true,
        role: 'OWNER' // Explicitly set role for Google OAuth users
    });

    return { ...user };
}

export async function createUserByAdmin(dtoUser: createUserByAdminInput) {
    const user = await UserRepository.createByAdmin(dtoUser)

    return user
}

export async function getUserByIdService2(userId: string) {
    const user = await UserRepository.getById(userId)

    if (!user) throw new AppError(Messages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return user
}