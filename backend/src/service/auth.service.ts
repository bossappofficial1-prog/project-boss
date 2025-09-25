import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { LoginInput } from "../schemas/auth.schema";
import { BcryptUtil, JwtUtil } from "../utils";
import { getUserByEmailService, getUserByIdService, updateUserPasswordService, createUserWithGoogleService } from "./user.service";
import { UserRepository } from "../repositories/user.repository";
import { redis } from "../config/redis";
import { randomUUID } from "crypto";
import { messagePublisher } from "./message-publisher.service";

export async function loginService(data: LoginInput) {
    const user = await getUserByEmailService(data.email);

    if (!user) {
        throw new AppError(Messages.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    if (!user.isVerified) throw new AppError(Messages.ACCOUNT_INACTIVE, HttpStatus.FORBIDDEN);

    const isPasswordValid = await BcryptUtil.compare(data.password, user.password);

    if (!isPasswordValid) {
        throw new AppError(Messages.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    await redis.set(`session:${user.id}`, JSON.stringify(user), 'EX', 60 * 60 * 24);

    const token = JwtUtil.generate({ sessionId: user.id, role: user.role });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        token,
    };
}

export async function getMeService(userId: string) {
    const user = await getUserByIdService(userId);
    if (!user) {
        throw new AppError("Pengguna tidak ditemukan.", HttpStatus.NOT_FOUND);
    }

    const { business, ...userWithoutBusiness } = user

    if (!business) {
        return { userWithoutBusiness, outlets: [], business: null }
    }

    const { outlets, ...businessWithoutOutlets } = business

    return { userWithoutBusiness, outlets, business: businessWithoutOutlets };
}

export async function resendVerificationService(email: string) {
    const user = await getUserByEmailService(email);

    if (!user) {
        throw new AppError("Email tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    if (user.isVerified) {
        throw new AppError("Akun sudah diverifikasi", HttpStatus.BAD_REQUEST);
    }

    // Check resend rate limit (3 attempts per day)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const rateLimitKey = `resend_attempts:${email}:${today}`;
    const maxAttempts = 3;

    const currentAttempts = await redis.get(rateLimitKey);
    const attemptCount = currentAttempts ? parseInt(currentAttempts) : 0;

    if (attemptCount >= maxAttempts) {
        throw new AppError(`Anda telah mencapai batas maksimal ${maxAttempts} kali pengiriman ulang kode verifikasi dalam sehari. Silakan coba lagi besok.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    // Increment attempt count (expires at end of day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ttlSeconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);

    await redis.set(rateLimitKey, (attemptCount + 1).toString(), 'EX', ttlSeconds);

    // Generate new verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await redis.set(`verification:${email}`, verificationCode, 'EX', 60 * 15); // 15 minutes

    // Send email via message queue
    await messagePublisher.publishResendVerificationEmail(email, verificationCode);
}

export async function forgotPasswordService(email: string) {
    const user = await getUserByEmailService(email);

    if (!user) throw new AppError(Messages.USER_NOT_FOUND, HttpStatus.BAD_REQUEST);

    if (!user.isVerified) throw new AppError(Messages.ACCOUNT_INACTIVE, HttpStatus.FORBIDDEN);

    // Check rate limit for forgot password (3 attempts per day)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const rateLimitKey = `forgot_password_attempts:${email}:${today}`;
    const maxAttempts = 3;

    const currentAttempts = await redis.get(rateLimitKey);
    const attemptCount = currentAttempts ? parseInt(currentAttempts) : 0;

    if (attemptCount >= maxAttempts) {
        throw new AppError(`Anda telah mencapai batas maksimal ${maxAttempts} kali permintaan reset password dalam sehari. Silakan coba lagi besok.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    // Increment attempt count (expires at end of day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ttlSeconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);

    await redis.set(rateLimitKey, (attemptCount + 1).toString(), 'EX', ttlSeconds);

    // Generate reset token
    const resetToken = randomUUID();
    await redis.set(`reset:${resetToken}`, user.id, 'EX', 60 * 15); // 15 minutes

    // Send email via message queue
    await messagePublisher.publishForgotPasswordEmail(email, resetToken);
}

export async function resetPasswordService(token: string, newPassword: string) {
    const userId = await redis.get(`reset:${token}`);

    if (!userId) {
        throw new AppError("Token tidak valid atau sudah expired", HttpStatus.BAD_REQUEST);
    }

    // Immediately delete the token to prevent reuse
    await redis.del(`reset:${token}`);

    // Now update the password
    await updateUserPasswordService(userId, newPassword);
}

export async function changePasswordService(userId: string, currentPassword: string, newPassword: string) {
    const user = await getUserByIdService(userId);

    if (!user) {
        throw new AppError("User tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    const isCurrentPasswordValid = await BcryptUtil.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
        throw new AppError("Password saat ini salah", HttpStatus.BAD_REQUEST);
    }

    await updateUserPasswordService(userId, newPassword);
}

export async function googleOAuthService(profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
}) {
    // Check if user already exists with this Google ID
    let user = await UserRepository.findByGoogleId(profile.googleId);

    if (!user) {
        // Check if email already exists (no account linking allowed)
        const existingUser = await getUserByEmailService(profile.email);
        if (existingUser) {
            throw new AppError("Email sudah terdaftar dengan akun lain.", HttpStatus.CONFLICT);
        }

        // Create new user
        user = await createUserWithGoogleService(profile);
    }

    // Create session and JWT token
    await redis.set(`session:${user.id}`, JSON.stringify(user), 'EX', 60 * 60 * 24);
    const token = JwtUtil.generate({ sessionId: user.id, role: user.role });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        token,
    };
}