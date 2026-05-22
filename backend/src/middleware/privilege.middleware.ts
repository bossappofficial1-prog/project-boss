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
