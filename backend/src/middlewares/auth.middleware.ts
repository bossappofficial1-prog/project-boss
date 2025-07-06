import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./error.middleware";
import { ResponseUtil } from "../utils/response.util";
import { verify } from "jsonwebtoken";
import { config } from "../configs/config";
import { AppError } from "../errors/api_errors";
import { getBusinessByIdService } from "../services/business.service";
import { getOutletById } from "../services/outlet.service";

export interface User {
    id: string;
    email: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: User;
}

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            role: string;
        }
        interface Outlet {
            id: string;
            name: string;
            address: string | null;
            phone: string | null;
            createdAt: Date;
            image: string | null;
        }
        interface Request {
            user?: User;
            outlet?: Outlet;
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

type ResourceType = 'business' | 'outlet';
export const isOwnerOfResource = (resourceType: ResourceType) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // cek apakah user sudah login dan rolenya OWNER
            if (!req.user || req.user.role !== 'OWNER') {
                throw new AppError('Akses ditolak.', 403)
            }

            const ownerId = req.user.id;
            let targetBusinessId: string | null = null

            if (resourceType === "business") {
                // ambil business ID dari request params
                const businessId = req.params.businessId;

                // jika request params tidak ada
                if (!businessId) throw new AppError('ID bisnis tidak ditemukan di parameter URL.', 400);

                targetBusinessId = businessId

                // ambil data business sesuai id user yang login
                const business = await getBusinessByIdService(businessId)

                // jika tidak business yang ditemukan dari user yang login
                if (!business) throw new AppError('Bisnis tidak ditemukan.', 404);

                // jika business owner ID tidak sesuai dengan ID user yang login
                if (business.ownerId !== ownerId) throw new AppError('Anda tidak memiliki akses ke bisnis ini.', 403);
            } else if (resourceType === "outlet") {

                const outletId = req.params.outletId

                if (!outletId) throw new AppError("ID Outlet tidak ditemukan di Parameter URL.", 400);

                const outlet = await getOutletById(outletId);

                if (!outlet) throw new AppError("Outlet tidak ditemukan.", 404);

                if (outlet.business.ownerId !== ownerId) throw new AppError("Anda tidak memiliki akses ke outlet ini.", 403)
            }

            res.locals.ownerBusinessId = targetBusinessId

            next()
        } catch (error) {
            next(error)
        }
    }
}