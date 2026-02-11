import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./error.middleware";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { JwtUtil } from "../utils";
import { UserRole } from "@prisma/client";
import { redis } from "../config/redis";
import { config } from "../config";

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Get token from cookies (httpOnly)
    let token: string | undefined = req.cookies.token || req.cookies.cashier_token;

    // Fallback to Authorization header for backward compatibility (if any)
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
        }
    }

    if (!token) {
        return next(new AppError(Messages.NOT_LOGGED_IN, HttpStatus.UNAUTHORIZED));
    }

    const decoded = JwtUtil.verify<{ sessionId: string; userType?: string }>(token);
    if (!decoded || !decoded.sessionId) {
        res.clearCookie("token", {
            httpOnly: true,
            secure: !!config.COOKIES_DOMAIN,
            sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
            domain: config.COOKIES_DOMAIN,
            path: '/'
        });
        res.clearCookie("cashier_token", {
            httpOnly: true,
            secure: !!config.COOKIES_DOMAIN,
            sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
            domain: config.COOKIES_DOMAIN,
            path: '/'
        });
        return next(new AppError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED));
    }

    // Cek session berdasarkan tipe user
    const sessionKey = decoded.userType === 'CASHIER'
        ? `session:cashier:${decoded.sessionId}`
        : `session:${decoded.sessionId}`;

    const session = await redis.get(sessionKey);
    if (!session) {
        res.clearCookie("token", {
            httpOnly: true,
            secure: !!config.COOKIES_DOMAIN,
            sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
            domain: config.COOKIES_DOMAIN,
            path: '/'
        });
        res.clearCookie("cashier_token", {
            httpOnly: true,
            secure: !!config.COOKIES_DOMAIN,
            sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
            domain: config.COOKIES_DOMAIN,
            path: '/'
        });
        return next(new AppError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED));
    }

    const user = JSON.parse(session);
    req.storedUser = user;
    next();
});

export const authorize = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.storedUser || !roles.includes(req.storedUser.role)) {
            return next(new AppError(Messages.UNAUTHORIZED, HttpStatus.FORBIDDEN));
        }
        next();
    };
};

// Middleware untuk mengizinkan Owner atau Kasir
export const authorizeOwnerOrCashier = (req: Request, res: Response, next: NextFunction) => {
    if (!req.storedUser) {
        return next(new AppError(Messages.UNAUTHORIZED, HttpStatus.FORBIDDEN));
    }

    const userType = (req.storedUser as any).userType;
    const role = req.storedUser.role;

    // Izinkan jika Owner atau Kasir
    if (role === UserRole.OWNER || userType === 'CASHIER') {
        return next();
    }

    return next(new AppError(Messages.UNAUTHORIZED, HttpStatus.FORBIDDEN));
};