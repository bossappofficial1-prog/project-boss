import { BaseService } from "./base.service";
import { UserRepository } from "../repositories/user.repository";
import { SessionRepository } from "../repositories/session.repository";
import { redis } from "../config/redis";
import { BcryptUtil, JwtUtil } from "../utils";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { DeviceFingerprint, DeviceFingerprintInput } from "../utils/device-fingerprint";

const BACKUP_CODES_COUNT = 8;
const BACKUP_CODE_LENGTH = 10;
const TOTP_ISSUER = "Bossapp Owner";
const TOTP_SETUP_PREFIX = "2fa:setup:";

export class TwoFactorService extends BaseService {
  static async generateSetup(userId: string, email: string) {
    const user = await UserRepository.findById(userId);
    if (!user) this.notFound("User tidak ditemukan");
    if (user.twoFactorEnabled) this.badRequest("2FA sudah aktif");

    const secret = generateSecret();
    const uri = generateURI({ strategy: "totp", label: email, issuer: TOTP_ISSUER, secret });
    const qrCode = await QRCode.toDataURL(uri);

    await redis.setex(
      `${TOTP_SETUP_PREFIX}${userId}`,
      60 * 10,
      JSON.stringify({ secret, verified: false }),
    );

    return { secret, qrCode, uri };
  }

  static async verifyAndEnable(userId: string, token: string) {
    const raw = await redis.get(`${TOTP_SETUP_PREFIX}${userId}`);
    if (!raw) {
      this.badRequest("Setup 2FA tidak ditemukan. Silakan ulangi.");
    }

    const { secret } = JSON.parse(raw);
    const isValid = verify({ token, secret });
    if (!isValid) this.badRequest("Kode verifikasi tidak valid");

    const backupCodes: string[] = [];
    const hashedBackupCodes: string[] = [];
    for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
      const code = TwoFactorService.generateBackupCode();
      backupCodes.push(code);
      hashedBackupCodes.push(await BcryptUtil.hash(code));
    }

    await UserRepository.update(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      backupCodes: JSON.stringify(hashedBackupCodes),
    });

    await redis.del(`${TOTP_SETUP_PREFIX}${userId}`);

    return { backupCodes };
  }

  static async disable(userId: string, password?: string, token?: string) {
    const user = await UserRepository.findById(userId);
    if (!user) this.notFound("User tidak ditemukan");
    if (!user.twoFactorEnabled) this.badRequest("2FA belum aktif");

    const hasPassword = !!user.password;
    if (hasPassword) {
      if (!password) this.badRequest("Password wajib diisi");
      const isValid = await BcryptUtil.compare(password, user.password);
      if (!isValid) this.unauthorized("Password salah");
    } else {
      if (!token) this.badRequest("Kode verifikasi wajib diisi");
      const isTokenValid = await this.verifyToken(userId, token!);
      if (!isTokenValid) this.unauthorized("Kode verifikasi tidak valid");
    }

    await UserRepository.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    });
  }

  static async verifyToken(userId: string, token: string) {
    const user = await UserRepository.findById(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    if (token.length === BACKUP_CODE_LENGTH) {
      return TwoFactorService.verifyBackupCode(userId, token);
    }

    try {
      return verify({ token, secret: user.twoFactorSecret });
    } catch {
      return false;
    }
  }

  static async regenerateBackupCodes(userId: string, password?: string, token?: string) {
    const user = await UserRepository.findById(userId);
    if (!user) this.notFound("User tidak ditemukan");
    if (!user.twoFactorEnabled) this.badRequest("2FA belum aktif");

    const hasPassword = !!user.password;
    if (hasPassword) {
      if (!password) this.badRequest("Password wajib diisi");
      const isValid = await BcryptUtil.compare(password, user.password);
      if (!isValid) this.unauthorized("Password salah");
    } else {
      if (!token) this.badRequest("Kode verifikasi wajib diisi");
      const isTokenValid = await this.verifyToken(userId, token!);
      if (!isTokenValid) this.unauthorized("Kode verifikasi tidak valid");
    }

    const backupCodes: string[] = [];
    const hashedBackupCodes: string[] = [];
    for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
      const code = TwoFactorService.generateBackupCode();
      backupCodes.push(code);
      hashedBackupCodes.push(await BcryptUtil.hash(code));
    }

    await UserRepository.update(userId, {
      backupCodes: JSON.stringify(hashedBackupCodes),
    });

    return backupCodes;
  }

  static async getStatus(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) this.notFound("User tidak ditemukan");
    return { enabled: user.twoFactorEnabled };
  }

  private static async verifyBackupCode(userId: string, code: string) {
    const user = await UserRepository.findById(userId);
    if (!user || !user.backupCodes) return false;

    const codes: string[] = JSON.parse(user.backupCodes);
    for (let i = 0; i < codes.length; i++) {
      if (await BcryptUtil.compare(code, codes[i])) {
        codes.splice(i, 1);
        await UserRepository.update(userId, {
          backupCodes: codes.length > 0 ? JSON.stringify(codes) : null,
        });
        return true;
      }
    }
    return false;
  }

  static isTrustedDevice(userId: string, trustCookie?: string, deviceFingerprint?: string): boolean {
    if (!trustCookie) return false;
    try {
      const payload = JwtUtil.verify<{ userId: string; purpose: string; fp: string }>(trustCookie);
      if (payload.userId !== userId || payload.purpose !== "trusted_device") return false;
      if (deviceFingerprint && payload.fp) {
        return payload.fp === deviceFingerprint;
      }
      return true;
    } catch {
      return false;
    }
  }

  private static generateBackupCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
