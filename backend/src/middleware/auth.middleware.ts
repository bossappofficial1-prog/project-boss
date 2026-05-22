import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./error.middleware";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { JwtUtil } from "../utils";
import { StaffRole, UserRole } from "@prisma/client";
import { redis } from "../config/redis";
import { config } from "../config";

type StaffSession = {
  id: string;
  name: string;
  outletId: string;
  businessId: string;
  userType: "CASHIER" | "MANAGER";
  role: "CASHIER" | "MANAGER";
  username?: string;
  privileges?: string[];
};

type OwnerSession = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId?: string;
  userType?: string;
  [key: string]: unknown;
};

export function getAuthUser(
  req: Request,
  roles?: (UserRole | StaffRole)[],
): OwnerSession | StaffSession | undefined {
  if (roles) {
    if (req.storedUser && roles.includes(req.storedUser.role as UserRole | StaffRole)) {
      return req.storedUser;
    }
    if (req.storedCashier && roles.includes(req.storedCashier.role as UserRole | StaffRole)) {
      return req.storedCashier;
    }
    return undefined;
  }
  return req.storedUser || req.storedCashier;
}

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let hasValidSession = false;

    const tryToken = async (t: string) => {
      try {
        const dec = JwtUtil.verify<{
          sessionId: string;
          userType?: string;
          role?: string;
        }>(t);
        if (!dec || !dec.sessionId) return null;

        const sessionKey =
          dec.userType === "CASHIER" || dec.userType === "MANAGER"
            ? `session:cashier:${dec.sessionId}`
            : `session:${dec.sessionId}`;

        const sess = await redis.get(sessionKey);
        if (!sess) return null;

        return { decoded: dec, session: sess };
      } catch {
        return null;
      }
    };

    // Try owner token → storedUser
    const ownerToken = req.cookies.token;
    if (ownerToken) {
      const result = await tryToken(ownerToken);
      if (result) {
        req.storedUser = JSON.parse(result.session);
        hasValidSession = true;
      }
    }

    // Try cashier token → storedCashier
    const cashierToken = req.cookies.cashier_token;
    if (cashierToken) {
      const result = await tryToken(cashierToken);
      if (result) {
        req.storedCashier = JSON.parse(result.session);
        hasValidSession = true;
      }
    }

    // Also check Authorization header (overrides cookie-based auth)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const headerToken = authHeader.substring(7);
      const result = await tryToken(headerToken);
      if (result) {
        const user = JSON.parse(result.session);
        if (user.userType === "CASHIER" || user.userType === "MANAGER") {
          req.storedCashier = user;
        } else {
          req.storedUser = user;
        }
        hasValidSession = true;
      }
    }

    if (!hasValidSession) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: !!config.COOKIES_DOMAIN,
        sameSite: !!config.COOKIES_DOMAIN ? "none" : "lax",
        domain: config.COOKIES_DOMAIN,
        path: "/",
      });
      res.clearCookie("cashier_token", {
        httpOnly: true,
        secure: !!config.COOKIES_DOMAIN,
        sameSite: !!config.COOKIES_DOMAIN ? "none" : "lax",
        domain: config.COOKIES_DOMAIN,
        path: "/",
      });
      return next(
        new AppError(Messages.NOT_LOGGED_IN, HttpStatus.UNAUTHORIZED),
      );
    }

    next();
  },
);

export const authorize = (...roles: (UserRole | StaffRole)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthUser(req, roles);
    if (!user) {
      return next(new AppError(Messages.UNAUTHORIZED, HttpStatus.FORBIDDEN));
    }
    // Promote matched staff session to storedUser so downstream controllers work
    if (user === req.storedCashier) {
      req.storedUser = user as any;
    }
    next();
  };
};
