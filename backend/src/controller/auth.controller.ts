import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { AuthService } from "../service/auth.service";
import { createUserService, verifyUserService } from "../service/user.service";
import { HttpStatus } from "../constants/http-status";
import { config } from "../config";
import { JwtUtil } from "../utils";
import { redis } from "../config/redis";
import { SubscriptionStatus } from "@prisma/client";
import {
  AUTH_COOKIE_NAMES,
  clearAuthCookie,
  getAuthRoleHint,
  getUserCookieName,
  setAuthCookie,
} from "../utils/auth-cookie";

const DEFAULT_GOOGLE_REDIRECT = "/owner";
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const getPrimaryClientUrl = () => {
  const clientUrls = Array.isArray(config.CLIENT_URL)
    ? config.CLIENT_URL
    : [config.CLIENT_URL];
  return clientUrls[0]?.trim() || "http://localhost:3010";
};

const getSafeRedirectPath = (value: unknown) => {
  if (typeof value !== "string") return DEFAULT_GOOGLE_REDIRECT;
  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_GOOGLE_REDIRECT;
  }
  return value;
};

class AuthController extends BaseController {
  verify = this.handler(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const user = await verifyUserService(email, code);
    const business = user.business as
      | (typeof user.business & {
          subscriptionStatus?: SubscriptionStatus;
          subscriptionPlan: any;
        })
      | null;
    await redis.set(
      `session:${user.id}`,
      JSON.stringify({ ...user, businessId: user.business?.id }),
      "EX",
      60 * 60 * 24,
    );

    const token = JwtUtil.generate({
      sessionId: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      isVerified: user.isVerified,
      provider: user.provider === "local" ? "email" : user.provider,
      businessId: business?.id,
      subscriptionStatus: business?.subscriptionStatus,
      subscriptionPlan: business?.subscriptionPlan,
    });

    const cookieName = getUserCookieName(user.role);
    setAuthCookie(res, cookieName, token, TOKEN_MAX_AGE_MS);
    setAuthCookie(res, AUTH_COOKIE_NAMES.legacy, token, TOKEN_MAX_AGE_MS);
    return this.success(res, user);
  });

  completeOnboarding = this.handler(async (req: Request, res: Response) => {
    const ownerId = req.storedUser?.id;

    if (!ownerId) {
      return this.error(
        res,
        "User tidak terautentikasi",
        undefined,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const onboardingResult = await AuthService.completeOnboarding(
      ownerId,
      req.body,
    );

    const user = await AuthService.getUserForSession(ownerId);
    if (!user) {
      return this.error(
        res,
        "User tidak ditemukan",
        undefined,
        HttpStatus.NOT_FOUND,
      );
    }

    const newToken = JwtUtil.generate({
      sessionId: ownerId,
      name: user.name,
      role: user.role,
      email: user.email,
      isVerified: user.isVerified,
      provider: user.provider === "local" ? "email" : user.provider,
      businessId: onboardingResult.business.id,
      subscriptionStatus: onboardingResult.business.subscriptionStatus,
      subscriptionPlan: onboardingResult.business.subscriptionPlan,
    });

    await redis.set(
      `session:${ownerId}`,
      JSON.stringify({
        ...user,
        businessId: onboardingResult.business.id,
        business: user.business ?? onboardingResult.business,
        subscriptionStatus: onboardingResult.business.subscriptionStatus,
      }),
      "EX",
      60 * 60 * 24,
    );

    const cookieName = getUserCookieName(user.role);
    setAuthCookie(res, cookieName, newToken, TOKEN_MAX_AGE_MS);
    setAuthCookie(res, AUTH_COOKIE_NAMES.legacy, newToken, TOKEN_MAX_AGE_MS);

    return this.success(
      res,
      {
        business: onboardingResult.business,
        subscription: onboardingResult.subscription,
        invoice: onboardingResult.invoice,
        token: newToken,
      },
      HttpStatus.CREATED,
    );
  });

  login = this.handler(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.login(payload);

    const cookieName = getUserCookieName(result.user.role);
    setAuthCookie(res, cookieName, result.token, TOKEN_MAX_AGE_MS);
    setAuthCookie(
      res,
      AUTH_COOKIE_NAMES.legacy,
      result.token,
      TOKEN_MAX_AGE_MS,
    );

    return this.success(res, {
      user: result.user,
    });
  });

  getMe = this.handler(async (req: Request, res: Response) => {
    const cacheKey = `user:${req.storedUser?.id}`;
    const user = await AuthService.getMe(req.storedUser!.id);

    await redis.set(cacheKey, JSON.stringify(user), "EX", 5 * 60);
    const { password, ...userWithoutPassword } = user.userWithoutBusiness;

    return this.success(res, {
      user: userWithoutPassword,
      outlets: user?.outlets ?? null,
      business: user?.business ?? null,
    });
  });

  logout = this.handler(async (req: Request, res: Response) => {
    const roleHint = getAuthRoleHint(req);
    const token =
      roleHint === "ADMIN"
        ? req.cookies[AUTH_COOKIE_NAMES.admin] ||
          req.cookies[AUTH_COOKIE_NAMES.legacy]
        : roleHint === "OWNER"
          ? req.cookies[AUTH_COOKIE_NAMES.owner] ||
            req.cookies[AUTH_COOKIE_NAMES.legacy]
          : roleHint === "CASHIER" || roleHint === "MANAGER"
            ? req.cookies[AUTH_COOKIE_NAMES.cashier]
            : req.cookies[AUTH_COOKIE_NAMES.owner] ||
              req.cookies[AUTH_COOKIE_NAMES.admin] ||
              req.cookies[AUTH_COOKIE_NAMES.cashier] ||
              req.cookies[AUTH_COOKIE_NAMES.legacy];

    // Try to clean up Redis session if token is valid
    if (token) {
      try {
        const decoded = JwtUtil.verify<{
          sessionId: string;
          userType?: string;
        }>(token);
        if (decoded && decoded.sessionId) {
          const sessionKey =
            decoded.userType === "CASHIER" || decoded.userType === "MANAGER"
              ? `session:cashier:${decoded.sessionId}`
              : `session:${decoded.sessionId}`;
          await redis.del(sessionKey);
        }
      } catch (error) {
        console.log(
          "Token verification failed during logout, but proceeding with cookie cleanup",
        );
      }
    }

    if (!roleHint) {
      clearAuthCookie(res, AUTH_COOKIE_NAMES.owner);
      clearAuthCookie(res, AUTH_COOKIE_NAMES.admin);
      clearAuthCookie(res, AUTH_COOKIE_NAMES.cashier);
      clearAuthCookie(res, AUTH_COOKIE_NAMES.legacy);
    } else if (roleHint === "OWNER") {
      clearAuthCookie(res, AUTH_COOKIE_NAMES.owner);
      clearAuthCookie(res, AUTH_COOKIE_NAMES.legacy);
    } else if (roleHint === "ADMIN") {
      clearAuthCookie(res, AUTH_COOKIE_NAMES.admin);
      clearAuthCookie(res, AUTH_COOKIE_NAMES.legacy);
    } else {
      clearAuthCookie(res, AUTH_COOKIE_NAMES.cashier);
    }

    return this.success(res, { message: "Logout berhasil" });
  });

  register = this.handler(async (req: Request, res: Response) => {
    const payload = req.body;
    const { verificationCode, ...user } = await createUserService(payload);
    const token = JwtUtil.generate({
      sessionId: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      isVerified: user.isVerified,
      provider: user.provider === "local" ? "email" : user.provider,
      businessId: user.business?.id,
      subscriptionStatus: user.business?.subscriptionStatus,
      subscriptionPlan: user.business?.subscriptionPlan,
    });

    const cookieName = getUserCookieName(user.role);
    setAuthCookie(res, cookieName, token, TOKEN_MAX_AGE_MS);
    setAuthCookie(res, AUTH_COOKIE_NAMES.legacy, token, TOKEN_MAX_AGE_MS);
    return this.success(res, user, HttpStatus.CREATED);
  });

  resendVerification = this.handler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await AuthService.resendVerification(email);
    return this.success(
      res,
      { message: "Email verifikasi telah dikirim ulang" },
      HttpStatus.OK,
      `Email verifikasi telah dikirim ulang ke ${email}`,
    );
  });

  forgotPassword = this.handler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await AuthService.forgotPassword(email);
    return this.success(res, { message: "Email reset password telah dikirim" });
  });

  resetPassword = this.handler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await AuthService.resetPassword(token, password);
    return this.success(res, { message: "Password berhasil direset" });
  });

  changePassword = this.handler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(
      req.storedUser!.id,
      currentPassword,
      newPassword,
    );
    return this.success(res, { message: "Password berhasil diubah" });
  });

  googleOAuthCallback = this.handler(async (req: any, res: Response) => {
    const clientUrl = getPrimaryClientUrl();
    const state = typeof req.query.state === "string" ? req.query.state : "{}";
    let redirectPath = DEFAULT_GOOGLE_REDIRECT;
    let from = "login";

    try {
      const parsed = JSON.parse(state);
      redirectPath = getSafeRedirectPath(parsed.redirect);
      from = typeof parsed.from === "string" ? parsed.from : "login";
    } catch {}

    const errorRedirect =
      from === "register"
        ? `${clientUrl}/auth/register?error=google_failed`
        : `${clientUrl}/auth/login?error=google_failed`;

    try {
      const user = req.user;

      if (!user) {
        return res.redirect(errorRedirect);
      }

      const token = user.token;

      const cookieName = getUserCookieName(user.user.role);
      setAuthCookie(res, cookieName, token, TOKEN_MAX_AGE_MS);
      setAuthCookie(res, AUTH_COOKIE_NAMES.legacy, token, TOKEN_MAX_AGE_MS);

      const checkBusinessUser = await AuthService.checkBusinessByOwnerId(
        user.user.id,
      );

      if (checkBusinessUser) {
        return res.redirect(`${clientUrl}${redirectPath}`);
      }

      const onboardingPath = `/auth/register?step=2&provider=google&name=${encodeURIComponent(user.user.name)}`;
      return res.redirect(`${clientUrl}${onboardingPath}`);
    } catch (error: any) {
      console.log(error);

      const linkMatch = error.message?.match(/\|link:([a-f0-9-]+)/);
      if (linkMatch) {
        const linkToken = linkMatch[1];
        return res.redirect(
          `${clientUrl}/auth/link-account?token=${linkToken}`,
        );
      }

      return res.redirect(errorRedirect);
    }
  });

  getLinkAccountInfo = this.handler(async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return this.error(
        res,
        "Token tidak valid",
        undefined,
        HttpStatus.BAD_REQUEST,
      );
    }

    const raw = await redis.get(`oauth:link:${token}`);
    if (!raw) {
      return this.error(
        res,
        "Token link sudah kadaluarsa",
        undefined,
        HttpStatus.GONE,
      );
    }

    const linkData = JSON.parse(raw) as { email: string; name: string };
    return this.success(res, { email: linkData.email, name: linkData.name });
  });

  linkAccount = this.handler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    if (!token || !password) {
      return this.error(
        res,
        "Token dan password wajib diisi",
        undefined,
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await AuthService.linkGoogleAccount(token, password);

    const clientUrl = getPrimaryClientUrl();

    const cookieName = getUserCookieName(result.user.role);
    setAuthCookie(res, cookieName, result.token, TOKEN_MAX_AGE_MS);
    setAuthCookie(
      res,
      AUTH_COOKIE_NAMES.legacy,
      result.token,
      TOKEN_MAX_AGE_MS,
    );

    const checkBusinessUser = await AuthService.checkBusinessByOwnerId(
      result.user.id,
    );

    if (checkBusinessUser) {
      return this.success(res, { redirect: `${clientUrl}/owner` });
    }

    return this.success(res, {
      redirect: `${clientUrl}/auth/register?step=2&provider=google&name=${encodeURIComponent(result.user.name)}`,
    });
  });

  cashierLogin = this.handler(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.cashierLogin(payload);

    setAuthCookie(res, AUTH_COOKIE_NAMES.cashier, result.token, TOKEN_MAX_AGE_MS);

    return this.success(res, {
      staff: result.staff,
      message: "Login kasir berhasil",
    });
  });

  managerLogin = this.handler(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.managerLogin(payload);

    setAuthCookie(res, AUTH_COOKIE_NAMES.cashier, result.token, TOKEN_MAX_AGE_MS);

    return this.success(res, {
      staff: result.staff,
      message: "Login manager berhasil",
    });
  });

  getCashierMe = this.handler(async (req: Request, res: Response) => {
    const staff = await AuthService.getCashierMe(req.storedUser!.id);

    return this.success(res, staff);
  });

  updateProfile = this.handler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const payload = req.body;

    const result = await AuthService.updateProfile(userId, payload);
    return this.success(res, result, HttpStatus.OK);
  });

  updatePassword = this.handler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const payload = req.body;

    const result = await AuthService.updatePassword(userId, payload);
    return this.success(res, result, HttpStatus.OK);
  });
}

export const authController = new AuthController();
