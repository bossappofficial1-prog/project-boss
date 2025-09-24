import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { loginService, getMeService, resendVerificationService, forgotPasswordService, resetPasswordService, changePasswordService } from "../service/auth.service";
import { ResponseUtil } from "../utils/response";
import { createUserService, verifyUserService } from "../service/user.service";
import { HttpStatus } from "../constants/http-status";
import { config } from "../config";
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
        secure: !!config.COOKIES_DOMAIN,
        sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
        domain: config.COOKIES_DOMAIN,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/'
    });

    return ResponseUtil.success(res, {
        user: result.user
    });
});


export const getMeController = asyncHandler(async (req: Request, res: Response) => {
    const user = await getMeService(req.user!.id);

    const { password, ...userWithoutPassword } = user.userWithoutBusiness

    return ResponseUtil.success(res, { user: userWithoutPassword, outlets: user?.outlets ?? null, business: user?.business ?? null });
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.token;

    // Try to clean up Redis session if token is valid
    if (token) {
        try {
            const decoded = JwtUtil.verify<{ sessionId: string }>(token);
            if (decoded && decoded.sessionId) {
                await redis.del(`session:${decoded.sessionId}`);
            }
        } catch (error) {
            console.log('Token verification failed during logout, but proceeding with cookie cleanup');
        }
    }

    res.clearCookie("token", {
        httpOnly: true,
        secure: !!config.COOKIES_DOMAIN,
        sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
        domain: config.COOKIES_DOMAIN,
        path: '/'
    });

    return ResponseUtil.success(res, { message: "Logout berhasil" });
});

export const registerController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const { verificationCode, ...user } = await createUserService(payload);

    return ResponseUtil.success(res, user, HttpStatus.CREATED);
});

export const resendVerificationController = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await resendVerificationService(email);
    return ResponseUtil.success(res, { message: "Email verifikasi telah dikirim ulang" });
});

export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await forgotPasswordService(email);
    return ResponseUtil.success(res, { message: "Email reset password telah dikirim" });
});

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await resetPasswordService(token, password);
    return ResponseUtil.success(res, { message: "Password berhasil direset" });
});

export const changePasswordController = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await changePasswordService(req.user!.id, currentPassword, newPassword);
    return ResponseUtil.success(res, { message: "Password berhasil diubah" });
});