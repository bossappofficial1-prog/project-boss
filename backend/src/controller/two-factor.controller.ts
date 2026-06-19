import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { TwoFactorService } from "../service/two-factor.service";
import { AuthService } from "../service/auth.service";
import { SessionService } from "../service/session.service";
import { UserRepository } from "../repositories/user.repository";
import { DeviceFingerprint } from "../utils/device-fingerprint";
import { HttpStatus } from "../constants/http-status";
import { JwtUtil } from "../utils";
import { redis } from "../config/redis";
import {
  AUTH_COOKIE_NAMES,
  getAuthRoleHint,
  getUserCookieName,
  setAuthCookie,
} from "../utils/auth-cookie";

class TwoFactorController extends BaseController {
  getStatus = this.handler(async (req: Request, res: Response) => {
    const userId = req.storedUser!.id;
    const status = await TwoFactorService.getStatus(userId);
    return this.success(res, status);
  });

  generateSetup = this.handler(async (req: Request, res: Response) => {
    const userId = req.storedUser!.id;
    const email = req.storedUser!.email;
    const result = await TwoFactorService.generateSetup(userId, email);
    return this.success(res, result);
  });

  verifyAndEnable = this.handler(async (req: Request, res: Response) => {
    const userId = req.storedUser!.id;
    const { token } = req.body;

    if (!token) {
      return this.error(res, "Kode verifikasi wajib diisi", undefined, HttpStatus.BAD_REQUEST);
    }

    const result = await TwoFactorService.verifyAndEnable(userId, token);
    return this.success(res, result, HttpStatus.OK, "2FA berhasil diaktifkan");
  });

  disable = this.handler(async (req: Request, res: Response) => {
    const userId = req.storedUser!.id;
    const { password } = req.body;

    if (!password) {
      return this.error(res, "Password wajib diisi", undefined, HttpStatus.BAD_REQUEST);
    }

    await TwoFactorService.disable(userId, password);
    return this.success(res, { message: "2FA berhasil dinonaktifkan" });
  });

  authenticate = this.handler(async (req: Request, res: Response) => {
    const { tempToken, token, trustDevice } = req.body;
    const fp = DeviceFingerprint.fromReq(req);

    if (!tempToken || !token) {
      return this.error(res, "Token dan kode verifikasi wajib diisi", undefined, HttpStatus.BAD_REQUEST);
    }

    let payload: { userId: string; purpose: string };
    try {
      payload = JwtUtil.verify<{ userId: string; purpose: string }>(tempToken);
    } catch {
      return this.error(res, "Token tidak valid atau sudah kedaluwarsa", undefined, HttpStatus.UNAUTHORIZED);
    }

    if (payload.purpose !== "2fa") {
      return this.error(res, "Token tidak valid", undefined, HttpStatus.UNAUTHORIZED);
    }

    const isValid = await TwoFactorService.verifyToken(payload.userId, token);
    if (!isValid) {
      return this.error(res, "Kode verifikasi tidak valid", undefined, HttpStatus.UNAUTHORIZED);
    }

    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      return this.error(res, "User tidak ditemukan", undefined, HttpStatus.NOT_FOUND);
    }

    const userSessionId = await SessionService.create(payload.userId, req, fp);

    await redis.set(
      `session:${payload.userId}`,
      JSON.stringify({ ...user, businessId: user.business?.id, sessionId: userSessionId }),
      "EX",
      60 * 60 * 24,
    );

    const authToken = JwtUtil.generate({
      sessionId: payload.userId,
      userSessionId,
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
    setAuthCookie(res, cookieName, authToken, 24 * 60 * 60 * 1000);
    setAuthCookie(res, AUTH_COOKIE_NAMES.legacy, authToken, 24 * 60 * 60 * 1000);

    if (trustDevice) {
      const trustToken = JwtUtil.generate(
        { userId: payload.userId, purpose: "trusted_device", fp },
        "30d",
      );
      setAuthCookie(res, AUTH_COOKIE_NAMES.trustDevice!, trustToken, 30 * 24 * 60 * 60 * 1000);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return this.success(res, {
      user: userWithoutPassword,
      token: authToken,
    });
  });

  regenerateBackupCodes = this.handler(async (req: Request, res: Response) => {
    const userId = req.storedUser!.id;
    const { password } = req.body;

    if (!password) {
      return this.error(res, "Password wajib diisi", undefined, HttpStatus.BAD_REQUEST);
    }

    const codes = await TwoFactorService.regenerateBackupCodes(userId, password);
    return this.success(res, { backupCodes: codes });
  });
}

export const twoFactorController = new TwoFactorController();
