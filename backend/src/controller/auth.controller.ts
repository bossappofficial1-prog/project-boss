import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { loginService } from "../service/auth.service";
import { ResponseUtil } from "../utils/response";
import { createUserService, verifyUserService } from "../service/user.service";
import { HttpStatus } from "../constants/http-status";
import { config } from "../config";
import { getMeService } from "../service/auth.service";
import { JwtUtil } from "../utils";
import { redis } from "../config/redis";

export const verifyController = asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const user = await verifyUserService(email, code);
    return ResponseUtil.success(res, user);
});


export const loginController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await loginService(payload);

    res.cookie("token", result.token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return ResponseUtil.success(res, { user: result.user });
});


export const getMeController = asyncHandler(async (req: Request, res: Response) => {
    const user = await getMeService(req.user!.id);

    const { password, ...userWithoutPassword } = user.userWithoutBusiness

    return ResponseUtil.success(res, { user: userWithoutPassword, outlets: user.outlets, business: user.business });
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (token) {
        const decoded = JwtUtil.verify<{ sessionId: string }>(token);
        if (decoded && decoded.sessionId) {
            await redis.del(`session:${decoded.sessionId}`);
        }
    }
    res.clearCookie("token");
    return ResponseUtil.success(res, { message: "Logout berhasil" });
});

export const registerController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const { verificationCode, ...user } = await createUserService(payload);

    return ResponseUtil.success(res, user, HttpStatus.CREATED);
});