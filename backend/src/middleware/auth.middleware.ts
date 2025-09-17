import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./error.middleware";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { JwtUtil } from "../utils";
import { getUserByIdService } from "../service/user.service";
import { UserRole } from "@prisma/client";

interface JwtPayload {
    userId: string;
    role: UserRole;
}
import { redis } from "../config/redis";

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.cookies);
    
    // Get token from cookies (httpOnly)
    let token: string | undefined = req.cookies.token;

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

    const decoded = JwtUtil.verify<{ sessionId: string }>(token);
    if (!decoded || !decoded.sessionId) {
        return next(new AppError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED));
    }

    const session = await redis.get(`session:${decoded.sessionId}`);
    if (!session) {
        return next(new AppError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED));
    }

    const user = JSON.parse(session);
    req.user = user;
    next();
});

export const authorize = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError(Messages.UNAUTHORIZED, HttpStatus.FORBIDDEN));
        }
        next();
    };
};