import { BaseService } from "./base.service";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import {
  LoginInput,
  CashierLoginInput,
  CompleteRegisterValues,
  ManagerLoginInput,
} from "../schemas/auth.schema";
import { BcryptUtil, CodeGeneratorUtil, JwtUtil } from "../utils";
import {
  getUserByEmailService,
  getUserByIdService,
  updateUserPasswordService,
  createUserWithGoogleService,
} from "./user.service";
import { UserRepository } from "../repositories/user.repository";
import { StaffRepository } from "../repositories/staff.repository";
import { redis } from "../config/redis";
import { RedisUtils } from "../utils/redis.utils";
import { randomUUID } from "crypto";
import { messagePublisher } from "./message-publisher.service";
import { BusinessRepository } from "../repositories/business.repository";
import { SubscriptionPlanRepository } from "../repositories/subscription-plan.repository";
import { OnboardingRepository } from "../repositories/onboarding.repository";
import {
  UpdatePasswordValues,
  UpdateProfileValues,
} from "../schemas/profile-setting.schema";
import { ImageService } from "./image.service";

export interface GoogleLinkToken {
  token: string;
  email: string;
  googleId: string;
  name: string;
  avatar?: string;
}

export class AuthService extends BaseService {
  static async login(data: LoginInput) {
    const user = await getUserByEmailService(data.email);

    if (!user) {
      this.unauthorized(Messages.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await BcryptUtil.compare(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.unauthorized(Messages.INVALID_CREDENTIALS);
    }

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
      businessId: user.business?.id,
      subscriptionStatus: user.business?.subscriptionStatus,
      subscriptionPlan: user.business?.subscriptionPlan,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  static async cashierLogin(data: CashierLoginInput) {
    const staff = await StaffRepository.findByUsername(data.username);
    if (!staff) {
      this.unauthorized("Username atau PIN salah");
    }

    // Pastikan staff memiliki PIN
    if (!staff.pin) {
      this.forbidden(
        "Akun kasir belum diaktifkan. Hubungi owner untuk mengatur PIN.",
      );
    }

    // Pastikan akun staff aktif
    if (staff.status !== "ACTIVE") {
      this.forbidden(
        "Akun kasir Anda dinonaktifkan atau sedang tidak aktif. Hubungi owner untuk mengaktifkan akun.",
      );
    }

    // Pastikan outlet tempat staff bertugas aktif/buka
    if (!staff.outlet) {
      this.forbidden("Data outlet tidak ditemukan untuk akun kasir ini.");
    }

    if (!staff.outlet.isOpen) {
      this.forbidden(
        "Outlet saat ini sedang tutup. Kasir tidak diperbolehkan login pada outlet yang tutup.",
      );
    }

    const isPinValid = await BcryptUtil.compare(data.password, staff.pin);

    if (!isPinValid) {
      this.unauthorized("Username atau PIN salah");
    }

    // Simpan session kasir di Redis
    const staffSession = {
      id: staff.id,
      username: staff.username,
      name: staff.name,
      outletId: staff.outletId,
      businessId: staff.outlet?.businessId,
      userType: "CASHIER",
      role: staff.role,
      status: staff.status,
      outletIsOpen: staff.outlet?.isOpen || false,
    };

    // Bersihkan cache status kasir yang lama agar ditarik segar dari DB
    await RedisUtils.del(`session:cashier:check:${staff.id}`);

    await RedisUtils.set(
      `session:cashier:${staff.id}`,
      staffSession,
      60 * 60 * 24,
    );

    const token = JwtUtil.generate({
      sessionId: staff.id,
      role: "CASHIER",
      userType: "CASHIER",
      outletId: staff.outletId,
      businessId: staff.outlet?.businessId,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin, ...staffWithoutPin } = staff;

    return {
      staff: staffWithoutPin,
      token,
    };
  }

  static async managerLogin(data: ManagerLoginInput) {
    const staff = await StaffRepository.findManagerByName(data.name);
    if (!staff) {
      this.unauthorized(Messages.INVALID_CREDENTIALS);
    }

    if (staff.role !== "MANAGER") {
      this.unauthorized("Akun ini bukan akun Manager");
    }

    if (!staff.pin) {
      this.forbidden(
        "Akun manager belum diaktifkan. Hubungi owner untuk mengatur PIN.",
      );
    }

    const isPinValid = await BcryptUtil.compare(data.pin, staff.pin);
    if (!isPinValid) {
      this.unauthorized(Messages.INVALID_CREDENTIALS);
    }

    // Pastikan akun manager aktif
    if (staff.status !== "ACTIVE") {
      this.forbidden(
        "Akun manager Anda dinonaktifkan atau sedang tidak aktif. Hubungi owner.",
      );
    }

    // Pastikan outlet tempat manager bertugas aktif/buka
    if (!staff.outlet) {
      this.forbidden("Data outlet tidak ditemukan untuk akun manager ini.");
    }

    if (!staff.outlet.isOpen) {
      this.forbidden(
        "Outlet saat ini sedang tutup. Manager tidak diperbolehkan login pada outlet yang tutup.",
      );
    }

    const privileges = staff.privileges.map((p) => p.privilege);

    const managerSession = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      outletId: staff.outletId,
      businessId: staff.outlet?.businessId,
      userType: "MANAGER",
      role: "MANAGER",
      privileges,
      status: staff.status,
      outletIsOpen: staff.outlet?.isOpen || false,
    };

    // Bersihkan cache status kasir/manager yang lama agar ditarik segar dari DB
    await RedisUtils.del(`session:cashier:check:${staff.id}`);

    await RedisUtils.set(
      `session:cashier:${staff.id}`,
      managerSession,
      60 * 60 * 24,
    );

    const token = JwtUtil.generate({
      sessionId: staff.id,
      role: "MANAGER",
      userType: "MANAGER",
      outletId: staff.outletId,
      businessId: staff.outlet?.businessId,
      privileges,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin, ...staffWithoutSensitive } = staff;

    return {
      staff: {
        ...staffWithoutSensitive,
        privileges,
      },
      token,
    };
  }

  static async getCashierMe(staffId: string) {
    const staff = await StaffRepository.findById(staffId);

    if (!staff) {
      this.notFound("Staff tidak ditemukan");
    }

    if (staff.status !== "ACTIVE") {
      this.forbidden(
        "Akun kasir Anda dinonaktifkan atau sedang tidak aktif. Hubungi owner.",
      );
    }

    if (!staff.outlet) {
      this.forbidden("Data outlet tidak ditemukan untuk akun kasir ini.");
    }

    if (!staff.outlet.isOpen) {
      this.forbidden(
        "Outlet saat ini sedang tutup. Kasir tidak diperbolehkan bertransaksi pada outlet yang tutup.",
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin, ...staffWithoutPin } = staff;

    return staffWithoutPin;
  }

  static async getMe(userId: string) {
    const user = await getUserByIdService(userId);
    if (!user) {
      this.notFound("Pengguna tidak ditemukan.");
    }

    const { business, ...userWithoutBusiness } = user;

    if (!business) {
      return { userWithoutBusiness, outlets: [], business: null };
    }

    const { outlets, ...businessWithoutOutlets } = business;
    const businessType = outlets.map((o) => o.type).join("::");
    // Transform outlets to include full QRIS URL
    const baseUrl = process.env.BASE_URL || "http://localhost:1234";
    const transformedOutlets =
      outlets?.map((outlet: any) => ({
        ...outlet,
        qrisImage: outlet.qrisImage
          ? `${baseUrl}/${outlet.qrisImage.replace(/\\/g, "/")}`
          : null,
      })) || [];

    return {
      userWithoutBusiness,
      outlets: transformedOutlets,
      business: { ...businessWithoutOutlets, type: businessType },
    };
  }

  static async resendVerification(email: string) {
    const user = await getUserByEmailService(email);

    if (!user) return;

    if (user.isVerified) {
      this.badRequest("Akun sudah diverifikasi");
    }

    // Check resend rate limit (3 attempts per day)
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const rateLimitKey = `resend_attempts:${email}:${today}`;
    const maxAttempts = 3;

    const currentAttempts = await redis.get(rateLimitKey);
    const attemptCount = currentAttempts ? parseInt(currentAttempts) : 0;

    if (attemptCount >= maxAttempts) {
      throw new AppError(
        `Anda telah mencapai batas maksimal ${maxAttempts} kali pengiriman ulang kode verifikasi dalam sehari. Silakan coba lagi besok.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment attempt count (expires at end of day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ttlSeconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);

    await redis.set(
      rateLimitKey,
      (attemptCount + 1).toString(),
      "EX",
      ttlSeconds,
    );

    // Generate new verification code
    const verificationCode = CodeGeneratorUtil.generate(6);
    await redis.set(`verification:${email}`, verificationCode, "EX", 60 * 10);
    const expiryCode = new Date();
    expiryCode.setMinutes(expiryCode.getMinutes() + 10);

    await UserRepository.update(user.id, {
      verificationCode,
      verificationCodeExpires: expiryCode,
    });

    // Send email via message queue
    await messagePublisher.publishResendVerificationEmail(
      email,
      verificationCode,
    );
  }

  static async forgotPassword(email: string) {
    const user = await getUserByEmailService(email);

    if (!user) this.badRequest(Messages.USER_NOT_FOUND);

    if (!user.isVerified) this.forbidden(Messages.ACCOUNT_INACTIVE);

    // Check rate limit for forgot password (3 attempts per day)
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const rateLimitKey = `forgot_password_attempts:${email}:${today}`;
    const maxAttempts = 3;

    const currentAttempts = await redis.get(rateLimitKey);
    const attemptCount = currentAttempts ? parseInt(currentAttempts) : 0;

    if (attemptCount >= maxAttempts) {
      throw new AppError(
        `Anda telah mencapai batas maksimal ${maxAttempts} kali permintaan reset password dalam sehari. Silakan coba lagi besok.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment attempt count (expires at end of day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ttlSeconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);

    await redis.set(
      rateLimitKey,
      (attemptCount + 1).toString(),
      "EX",
      ttlSeconds,
    );

    // Generate reset token
    const resetToken = randomUUID();
    await redis.set(`reset:${resetToken}`, user.id, "EX", 60 * 15); // 15 minutes

    // Send email via message queue
    await messagePublisher.publishForgotPasswordEmail(email, resetToken);
  }

  static async resetPassword(token: string, newPassword: string) {
    const userId = await redis.get(`reset:${token}`);

    if (!userId) {
      this.badRequest("Token tidak valid atau sudah expired");
    }

    // Immediately delete the token to prevent reuse
    await redis.del(`reset:${token}`);

    // Now update the password
    await updateUserPasswordService(userId, newPassword);
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await getUserByIdService(userId);

    if (!user) {
      this.notFound("User tidak ditemukan");
    }

    const isCurrentPasswordValid = await BcryptUtil.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      this.badRequest("Password saat ini salah");
    }

    await updateUserPasswordService(userId, newPassword);
  }

  static async googleOAuth(profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    let user = await UserRepository.findByGoogleId(profile.googleId);

    if (!user) {
      const existingUser = await getUserByEmailService(profile.email);
      if (existingUser) {
        const linkToken = randomUUID();
        const linkData: GoogleLinkToken = {
          token: linkToken,
          email: profile.email,
          googleId: profile.googleId,
          name: profile.name,
          avatar: profile.avatar,
        };
        await redis.set(
          `oauth:link:${linkToken}`,
          JSON.stringify(linkData),
          "EX",
          10 * 60,
        );
        this.conflict(
          `Email sudah terdaftar dengan akun lain.|link:${linkToken}`,
        );
      }

      user = await createUserWithGoogleService(profile);
    }

    await redis.set(
      `session:${user.id}`,
      JSON.stringify({ ...user, businessId: user.business?.id }),
      "EX",
      60 * 60 * 24,
    );
    const token = JwtUtil.generate({
      sessionId: user.id,
      role: user.role,
      isVerified: user.isVerified,
      email: user.email,
      name: user.name,
      provider: user.provider,
      businessId: user.business?.id ?? null,
      subscriptionStatus: user.business?.subscriptionStatus ?? null,
      subscriptionPlan: user.business?.subscriptionPlan ?? null,
    });

    return {
      user,
      token,
    };
  }

  static async linkGoogleAccount(
    linkToken: string,
    password: string,
  ): Promise<{ user: any; token: string }> {
    const raw = await redis.get(`oauth:link:${linkToken}`);
    if (!raw) {
      this.badRequest(
        "Token link sudah kadaluarsa. Silakan login dengan Google kembali.",
      );
    }

    const linkData: GoogleLinkToken = JSON.parse(raw);

    const user = await getUserByEmailService(linkData.email);
    if (!user) {
      this.notFound("User tidak ditemukan");
    }

    const isPasswordValid = await BcryptUtil.compare(password, user.password);
    if (!isPasswordValid) {
      this.unauthorized(Messages.INVALID_CREDENTIALS);
    }

    await UserRepository.update(user.id, {
      googleId: linkData.googleId,
      provider: "google",
      isVerified: true,
    });

    await redis.del(`oauth:link:${linkToken}`);

    await redis.set(
      `session:${user.id}`,
      JSON.stringify({ ...user, businessId: user.business?.id }),
      "EX",
      60 * 60 * 24,
    );
    const token = JwtUtil.generate({
      sessionId: user.id,
      role: user.role,
      isVerified: true,
      email: user.email,
      name: user.name,
      provider: "google",
      businessId: user.business?.id ?? null,
      subscriptionStatus: user.business?.subscriptionStatus ?? null,
      subscriptionPlan: user.business?.subscriptionPlan ?? null,
    });

    return { user, token };
  }

  static async completeOnboarding(
    ownerId: string,
    data: CompleteRegisterValues,
  ) {
    const owner = await UserRepository.findById(ownerId);
    if (!owner) {
      this.notFound("User tidak ditemukan");
    }

    if (!owner.isVerified) {
      this.badRequest("Akun belum terverifikasi");
    }

    const existingBusiness = await BusinessRepository.findByOwnerId(ownerId);
    if (existingBusiness) {
      this.badRequest("Bisnis sudah terdaftar");
    }

    if (
      await SubscriptionPlanRepository.existingBusinessName(
        data.businessName.trim(),
      )
    ) {
      this.badRequest(
        `Nama bisnis ${data.businessName.trim()}, sudah tersedia.`,
      );
    }

    const planCode = data.selectedPlan.toUpperCase();
    const plan = await SubscriptionPlanRepository.getByCode(planCode);

    if (!plan) {
      this.notFound(`Paket langganan ${planCode} tidak ditemukan`);
    }

    return OnboardingRepository.completeOnboarding({
      ownerId,
      businessName: data.businessName,
      description: data.description,
      plan,
    });
  }

  static async updateProfile(userId: string, data: UpdateProfileValues) {
    const user = await UserRepository.findById(userId);

    if (!user) this.notFound(Messages.USER_NOT_FOUND);
    const updated = await UserRepository.updateProfile(userId, data);

    if (data.avatar && user.avatar) {
      try {
        ImageService.deleteImageByUrl(user.avatar);
      } catch (error) {
        console.error(error);
      }
    }
    redis.del(`user:${userId}`);
    return updated;
  }

  static async updatePassword(userId: string, data: UpdatePasswordValues) {
    const user = await UserRepository.findById(userId);

    if (!user) this.notFound(Messages.USER_NOT_FOUND);

    const isPasswordValid = await BcryptUtil.compare(
      data.currentPassword,
      user.password,
    );
    if (!isPasswordValid) this.badRequest(`Kata sandi saat ini salah.`);

    const newPassword = await BcryptUtil.hash(data.newPassword);
    const updated = await UserRepository.updatePassword(userId, newPassword);

    redis.del(`user:${userId}`);
    return updated;
  }

  static async checkBusinessByOwnerId(ownerId: string) {
    return BusinessRepository.findByOwnerId(ownerId);
  }

  static async getUserForSession(userId: string) {
    return UserRepository.findById(userId);
  }
}
