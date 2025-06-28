import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/api_errors";
import { db } from "../configs/database";

export async function authorizeOutletAccess(req: Request, res: Response, next: NextFunction) {
    try {
        const { outletId } = req.params
        const user = req.user

        if (!user) throw new AppError("User belum terautentikasi", 401);

        const outlet = await db.outlet.findUnique({
            where: { id: outletId },
            include: {
                business: {
                    select: { ownerId: true }
                }
            }
        })

        if (!outlet) throw new AppError("Outlet tidak ditemukan", 404);

        if (outlet.business.ownerId !== user.id) {
            throw new AppError("Akses outlet ditolak", 403)
        }

        req.outlet = outlet
        next()
    } catch (error) {
        next(error)
    }
}