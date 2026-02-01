import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { loginService, getMeService, resendVerificationService, forgotPasswordService, resetPasswordService, changePasswordService, googleOAuthService, cashierLoginService, getCashierMeService } from "../service/auth.service";
import { ResponseUtil } from "../utils/response";
import { createUserService, verifyUserService } from "../service/user.service";
import { HttpStatus } from "../constants/http-status";
import { config } from "../config";
import { JwtUtil } from "../utils";
import { redis } from "../config/redis";
import { BusinessRepository } from "../repositories/business.repository";

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
    const user = await getMeService(req.storedUser!.id);

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
    await changePasswordService(req.storedUser!.id, currentPassword, newPassword);
    return ResponseUtil.success(res, { message: "Password berhasil diubah" });
});

export const googleOAuthCallbackController = asyncHandler(async (req: any, res: Response) => {
    const clientUrl = config.CLIENT_URL[0]?.trim() || 'http://localhost:3010';

    try {
        const user = req.user;

        if (!user) {
            return res.redirect(`${clientUrl}/auth/login?error=${encodeURIComponent("Google authentication failed")}`);
        }
        const checkBusinessUser = await BusinessRepository.findByOwnerId(user.user.id)

        // Set JWT token as cookie
        const token = user.token;

        res.cookie("token", token, {
            httpOnly: true,
            secure: !!config.COOKIES_DOMAIN,
            sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
            domain: config.COOKIES_DOMAIN,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/'
        });

        if (checkBusinessUser) {
            return res.redirect(`${clientUrl}/owner/dashboard`)
        }
        res.redirect(`${clientUrl}/auth/register?step=2&provider=google&name=${user.user.name}`);
    } catch (error: any) {
        console.log(error)
        if (error.message && error.message.includes("Email sudah terdaftar")) {
            const errorMessage = encodeURIComponent("Email sudah terdaftar dengan akun lain.");
            return res.redirect(`${clientUrl}/auth/login?error=${errorMessage}`);
        }
        return res.redirect(`${clientUrl}/auth/login?error=${encodeURIComponent("Google authentication failed")}`);
    }
});

export const cashierLoginController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await cashierLoginService(payload);

    res.cookie("cashier_token", result.token, {
        httpOnly: true,
        secure: !!config.COOKIES_DOMAIN,
        sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
        domain: config.COOKIES_DOMAIN,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/'
    });

    return ResponseUtil.success(res, {
        staff: result.staff,
        message: "Login kasir berhasil"
    });
});

export const getCashierMeController = asyncHandler(async (req: Request, res: Response) => {
    const staff = await getCashierMeService(req.storedUser!.id);

    return ResponseUtil.success(res, staff);
});