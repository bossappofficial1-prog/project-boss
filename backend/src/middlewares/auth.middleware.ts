import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./error.middleware";
import { ResponseUtil } from "../utils/response.util";
import { verify } from "jsonwebtoken";
import { config } from "../configs/config";

export interface AuthRequest extends Request {
    user?: {
        id: string,
        email: string,
        role: string
    }
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string,
                email: string,
                role: string
            };
        }
    }
}


export const authenticate = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        let token: string | undefined

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (!token) {
            return ResponseUtil.unauthorized(res, 'Access token is required')
        }

        try {
            const decoded = verify(token, config.JWT_SECRET!) as any
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            }
            return next()
        } catch (error) {
            return ResponseUtil.unauthorized(res, 'Invalid token')
        }
    }
)

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return ResponseUtil.unauthorized(res, 'Access token is required');
        }

        if (!roles.includes(req.user.role)) {
            return ResponseUtil.forbidden(res, 'Insufficient permissions');
        }

        return next();
    };
};