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
    let token: string | undefined;
    let decoded: { sessionId: string; userType?: string; role?: string } | null = null;
    let session: string | null = null;

    const tryToken = async (t: string) => {
        try {
            const dec = JwtUtil.verify<{ sessionId: string; userType?: string; role?: string }>(t);
            if (!dec || !dec.sessionId) return null;

            const sessionKey = (dec.userType === 'CASHIER' || dec.userType === 'MANAGER')
                ? `session:cashier:${dec.sessionId}`
                : `session:${dec.sessionId}`;

            const sess = await redis.get(sessionKey);
            if (!sess) return null;

            return { decoded: dec, session: sess };
        } catch {
            return null;
        }
    };

    // 1. Determine token priority based on request path
    const isCashierRequest = req.path.includes('/cashier') || req.path.includes('/manager') || req.path.includes('/staff');
    
    // Check Authorization header first as fallback if cookies aren't used or as custom headers
    let headerToken: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        headerToken = authHeader.substring(7);
    }

    const firstToken = headerToken 
        ? headerToken 
        : (isCashierRequest && req.cookies.cashier_token)
            ? req.cookies.cashier_token
            : (req.cookies.token || req.cookies.cashier_token);

    const secondToken = headerToken
        ? undefined
        : firstToken === req.cookies.token
            ? req.cookies.cashier_token
            : req.cookies.token;

    // 2. Try first token
    if (firstToken) {
        const result = await tryToken(firstToken);
        if (result) {
            decoded = result.decoded;
            session = result.session;
            token = firstToken;
        }
    }

    // 3. Fallback to second token if first failed
    if (!session && secondToken) {
        const result = await tryToken(secondToken);
        if (result) {
            decoded = result.decoded;
            session = result.session;
            token = secondToken;
        }
    }

    // 4. If still no session, clear all cookies and throw NOT_LOGGED_IN
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
        return next(new AppError(Messages.NOT_LOGGED_IN, HttpStatus.UNAUTHORIZED));
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

// Middleware untuk mengizinkan Owner atau Manager
export const authorizeOwnerOrManager = (req: Request, res: Response, next: NextFunction) => {
    if (!req.storedUser) {
        return next(new AppError(Messages.UNAUTHORIZED, HttpStatus.FORBIDDEN));
    }

    const userType = (req.storedUser as any).userType;
    const role = req.storedUser.role;

    if (role === UserRole.OWNER || role === UserRole.ADMIN || userType === 'MANAGER') {
        return next();
    }

    return next(new AppError(Messages.UNAUTHORIZED, HttpStatus.FORBIDDEN));
};