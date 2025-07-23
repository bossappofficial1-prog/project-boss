import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { LoginInput } from "../schemas/auth.schema";
import { BcryptUtil, JwtUtil } from "../utils";
import { getUserByEmailService, getUserByIdService } from "./user.service";
import { redis } from "../config/redis";
import { randomUUID } from "crypto";

export async function loginService(data: LoginInput) {
    const user = await getUserByEmailService(data.email);

    if (!user) {
        throw new AppError(Messages.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await BcryptUtil.compare(data.password, user.password);

    if (!isPasswordValid) {
        throw new AppError(Messages.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    const sessionId = randomUUID();
    await redis.set(`session:${sessionId}`, JSON.stringify(user), 'EX', 60 * 60 * 24);

    const token = JwtUtil.generate({ sessionId });
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