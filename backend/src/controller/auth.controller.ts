import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { loginService, getMeService, resendVerificationService, forgotPasswordService, resetPasswordService, changePasswordService, googleOAuthService, cashierLoginService, getCashierMeService, completeOnboardingService } from "../service/auth.service";
import { ResponseUtil } from "../utils/response";
import { createUserService, verifyUserService } from "../service/user.service";
import { HttpStatus } from "../constants/http-status";
import { config } from "../config";
import { JwtUtil } from "../utils";
import { redis } from "../config/redis";
import { BusinessRepository } from "../repositories/business.repository";
import { SubscriptionStatus } from "@prisma/client";
import { UserRepository } from "../repositories/user.repository";

export const verifyController = asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const user = await verifyUserService(email, code);
    const business = user.business as (typeof user.business & { subscriptionStatus?: SubscriptionStatus }) | null;
    await redis.set(`session:${user.id}`, JSON.stringify({ ...user, businessId: user.business?.id }), 'EX', 60 * 60 * 24);

    const token = JwtUtil.generate({
        sessionId: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        isVerified: user.isVerified,
        provider: user.provider === 'local' ? 'email' : user.provider,
        businessId: business?.id,
        subscriptionStatus: business?.subscriptionStatus
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: !!config.COOKIES_DOMAIN,
        sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
        domain: config.COOKIES_DOMAIN,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/'
    });
    return ResponseUtil.success(res, user);
});

export const completeOnboardingController = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.storedUser?.id;

    if (!ownerId) {
        return ResponseUtil.error(res, "User tidak terautentikasi", undefined, HttpStatus.UNAUTHORIZED);
    }

    const onboardingResult = await completeOnboardingService(ownerId, req.body);

    const user = await UserRepository.findById(ownerId);
    if (!user) {
        return ResponseUtil.error(res, "User tidak ditemukan", undefined, HttpStatus.NOT_FOUND);
    }

    const newToken = JwtUtil.generate({
        sessionId: ownerId,
        name: user.name,
        role: user.role,
        email: user.email,
        isVerified: user.isVerified,
        provider: user.provider === 'local' ? 'email' : user.provider,
        businessId: onboardingResult.business.id,
        subscriptionStatus: onboardingResult.business.subscriptionStatus,
    });

    await redis.set(
        `session:${ownerId}`,
        JSON.stringify({
            ...user,
            businessId: onboardingResult.business.id,
            business: user.business ?? onboardingResult.business,
            subscriptionStatus: onboardingResult.business.subscriptionStatus,
        }),
        'EX',
        60 * 60 * 24
    );

    res.cookie("token", newToken, {
        httpOnly: true,
        secure: !!config.COOKIES_DOMAIN,
        sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
        domain: config.COOKIES_DOMAIN,
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
    });

    return ResponseUtil.success(res, {
        business: onboardingResult.business,
        subscription: onboardingResult.subscription,
        invoice: onboardingResult.invoice,
        token: newToken,
    }, HttpStatus.CREATED);
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

    const cacheKey = `user:${req.storedUser?.id}`
    const cacheData = await redis.get(cacheKey)
    if (cacheData) {
        console.log('get user from redis')
        const data = JSON.parse(cacheData)
        const { password, ...userWithoutPassword } = data.userWithoutBusiness
        return ResponseUtil.success(res, { user: userWithoutPassword, outlets: data?.outlets ?? null, business: data?.business ?? null });
    }

    const user = await getMeService(req.storedUser!.id);

    await redis.set(cacheKey, JSON.stringify(user), 'EX', 5 * 60)
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
    const token = JwtUtil.generate({
        sessionId: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        isVerified: user.isVerified,
        provider: user.provider === 'local' ? 'email' : user.provider,
        businessId: user.business?.id
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: !!config.COOKIES_DOMAIN,
        sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
        domain: config.COOKIES_DOMAIN,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/'
    });
    return ResponseUtil.success(res, user, HttpStatus.CREATED);
});

export const resendVerificationController = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await resendVerificationService(email);
    return ResponseUtil.success(res, { message: "Email verifikasi telah dikirim ulang" }, HttpStatus.OK, `Email verifikasi telah dikirim ulang ke ${email}`);
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