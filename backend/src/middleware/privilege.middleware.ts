import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { StaffPrivilegeType } from "@prisma/client";
import { getAuthUser } from "./auth.middleware";

/**
 * Middleware untuk cek apakah Manager memiliki privilege tertentu.
 * Harus dipanggil setelah `protect` middleware.
 */
export const authorizePrivilege = (requiredPrivilege: StaffPrivilegeType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthUser(req);

    if (!user) {
      return next(new AppError("Tidak terautentikasi", HttpStatus.UNAUTHORIZED));
    }

    if (user.userType !== "MANAGER" && user.role !== "MANAGER") {
      return next(
        new AppError(
          "Akses ditolak. Endpoint ini hanya untuk Manager.",
          HttpStatus.FORBIDDEN,
        ),
      );
    }

    const privileges: string[] = (user as any).privileges || [];
    if (!privileges.includes(requiredPrivilege)) {
      return next(
        new AppError(
          `Akses ditolak. Anda tidak memiliki privilege: ${requiredPrivilege}`,
          HttpStatus.FORBIDDEN,
        ),
      );
    }

    next();
  };
};

/**
 * Middleware: hanya Manager yang boleh akses (tanpa cek privilege spesifik)
 */
export const authorizeManager = (req: Request, res: Response, next: NextFunction) => {
  const user = getAuthUser(req);

  if (!user) {
    return next(new AppError("Tidak terautentikasi", HttpStatus.UNAUTHORIZED));
  }

  if (user.userType !== "MANAGER" && user.role !== "MANAGER") {
    return next(
      new AppError("Akses ditolak. Endpoint ini hanya untuk Manager.", HttpStatus.FORBIDDEN),
    );
  }

  next();
};

/**
 * Middleware: Izinkan Owner/Admin, atau Manager yang memiliki privilege tertentu.
 */
export const authorizeOwnerOrManagerPrivilege = (requiredPrivilege: StaffPrivilegeType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthUser(req);

    if (!user) {
      return next(new AppError("Tidak terautentikasi", HttpStatus.UNAUTHORIZED));
    }

    // Owner dan Admin langsung diizinkan
    if (user.role === "OWNER" || user.role === "ADMIN") {
      return next();
    }

    // Manager harus memiliki privilege yang sesuai
    if (user.role === "MANAGER" || user.userType === "MANAGER") {
      const privileges: string[] = (user as any).privileges || [];
      const hasPriv = privileges.some((p: any) => {
        const privName = p.privilege || p;
        return privName === requiredPrivilege;
      });

      if (hasPriv) {
        // Promosikan staff session ke storedUser agar controller bisa membaca businessId
        if (req.storedCashier && !req.storedUser) {
          req.storedUser = req.storedCashier as any;
        }
        return next();
      }
    }

    return next(
      new AppError(
        `Akses ditolak. Anda tidak memiliki hak akses: ${requiredPrivilege}`,
        HttpStatus.FORBIDDEN,
      ),
    );
  };
};

