import { NextFunction, Request, Response } from "express";
import { getUserByEmailService } from "../service/user.service";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

export const checkEmailExists = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { email } = req.body
    const userId = req.params.userId
    if (!email) return next();

    const existingUser = await getUserByEmailService(email, userId)

    if (existingUser) throw new AppError("Email sudah terdaftar", HttpStatus.BAD_REQUEST);

    return next()
}