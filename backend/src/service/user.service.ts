import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { UserRepository } from "../repositories/user.repository";
import { CreateUserInput, UpdateUserInput } from "../schemas/user.schema";
import { UserMe } from "../types/Others";
import { BcryptUtil } from "../utils";
import { randomUUID } from "crypto";
import { CodeGeneratorUtil, DateUtil } from "../utils";
import { messagePublisher } from "./message-publisher.service";

export async function getAllUserService() {
    const users = await UserRepository.findAll();
    return users.map(user => ({ ...user, password: '[REDACTED]' }))
}

export async function getUserByIdService(userId: string) {
    const user = await UserRepository.findById(userId) as UserMe
    if (!user) throw new AppError(Messages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return { ...user, password: '[REDACTED]' }
}

export async function getUserByEmailService(email: string, ignoreUserId?: string) {
    const user = await UserRepository.findByEmail(email, ignoreUserId)

    return user
}

export async function createUserService(data: CreateUserInput) {
    data.password = (await BcryptUtil.hash(data.password))!

    const verificationCode = CodeGeneratorUtil.generate(6);
    const verificationCodeExpires = DateUtil.addMinutes(new Date(), 10); // Code expires in 10 minutes

    const user = await UserRepository.create({
        ...data,
        verificationCode,
        verificationCodeExpires,
    });

    // Terbitkan event untuk mengirim email verifikasi
    await messagePublisher.publishSendVerificationEmail(user.email, verificationCode);

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
        provider: 'google',
        isVerified: true,
        role: 'OWNER' // Explicitly set role for Google OAuth users
    });

    return { ...user, password: '[REDACTED]' };
}