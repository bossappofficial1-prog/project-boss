import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./error.middleware";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { JwtUtil } from "../utils";
import { StaffRole, UserRole } from "@prisma/client";
import { redis } from "../config/redis";
import {
  AUTH_COOKIE_NAMES,
  clearAuthCookie,
  getAuthRoleHint,
} from "../utils/auth-cookie";

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
    if (
      req.storedUser &&
      roles.includes(req.storedUser.role as UserRole | StaffRole)
    ) {
      return req.storedUser;
    }
    if (
      req.storedCashier &&
      roles.includes(req.storedCashier.role as UserRole | StaffRole)
    ) {
      return req.storedCashier;
    }
    return undefined;
  }
  return req.storedUser || req.storedCashier;
}

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let hasValidSession = false;

    const tryToken = async (t: string, expectedRole?: string) => {
      try {
        const dec = JwtUtil.verify<{
          sessionId: string;
          userType?: string;
          role?: string;
        }>(t);
        if (!dec || !dec.sessionId) return null;
        if (expectedRole && dec.role !== expectedRole) return null;

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

    const roleHint = getAuthRoleHint(req);

    const legacyToken = req.cookies[AUTH_COOKIE_NAMES.legacy];
    const ownerToken = req.cookies[AUTH_COOKIE_NAMES.owner];
    const adminToken = req.cookies[AUTH_COOKIE_NAMES.admin];
    const cashierToken = req.cookies[AUTH_COOKIE_NAMES.cashier];

    const userTokenCandidates: Array<{
      token: string;
      expectedRole?: string;
    }> = [];

    if (roleHint === "ADMIN") {
      if (adminToken) {
        userTokenCandidates.push({ token: adminToken, expectedRole: "ADMIN" });
      }
      if (legacyToken) {
        userTokenCandidates.push({ token: legacyToken, expectedRole: "ADMIN" });
      }
    } else if (roleHint === "OWNER") {
      if (ownerToken) {
        userTokenCandidates.push({ token: ownerToken, expectedRole: "OWNER" });
      }
      if (legacyToken) {
        userTokenCandidates.push({ token: legacyToken, expectedRole: "OWNER" });
      }
    } else if (roleHint === "CASHIER" || roleHint === "MANAGER") {
      // Skip owner/admin tokens for staff-scoped requests
    } else {
      if (ownerToken) {
        userTokenCandidates.push({ token: ownerToken, expectedRole: "OWNER" });
      }
      if (adminToken) {
        userTokenCandidates.push({ token: adminToken, expectedRole: "ADMIN" });
      }
      if (legacyToken) {
        userTokenCandidates.push({ token: legacyToken });
      }
    }

    for (const candidate of userTokenCandidates) {
      const result = await tryToken(candidate.token, candidate.expectedRole);
      if (result) {
        req.storedUser = JSON.parse(result.session);
        hasValidSession = true;
        break;
      }
    }

    const shouldTryCashier =
      !roleHint || roleHint === "CASHIER" || roleHint === "MANAGER";
    if (cashierToken && shouldTryCashier) {
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
      const expectedRole =
        roleHint === "OWNER" || roleHint === "ADMIN" ? roleHint : undefined;
      const result = await tryToken(headerToken, expectedRole);
      if (result) {
        const isStaffHint =
          roleHint === "CASHIER" || roleHint === "MANAGER";
        if (
          isStaffHint &&
          result.decoded.role !== "CASHIER" &&
          result.decoded.role !== "MANAGER"
        ) {
          // Ignore non-staff tokens for cashier/manager scoped requests
        } else {
        const user = JSON.parse(result.session);
        if (user.userType === "CASHIER" || user.userType === "MANAGER") {
          req.storedCashier = user;
        } else {
          req.storedUser = user;
        }
        hasValidSession = true;
        }
      }
    }

    if (!hasValidSession) {
      const cookiesToClear = new Set<string>();

      if (!roleHint) {
        cookiesToClear.add(AUTH_COOKIE_NAMES.owner);
        cookiesToClear.add(AUTH_COOKIE_NAMES.admin);
        cookiesToClear.add(AUTH_COOKIE_NAMES.legacy);
        cookiesToClear.add(AUTH_COOKIE_NAMES.cashier);
      } else if (roleHint === "OWNER") {
        cookiesToClear.add(AUTH_COOKIE_NAMES.owner);
        cookiesToClear.add(AUTH_COOKIE_NAMES.legacy);
      } else if (roleHint === "ADMIN") {
        cookiesToClear.add(AUTH_COOKIE_NAMES.admin);
        cookiesToClear.add(AUTH_COOKIE_NAMES.legacy);
      } else {
        cookiesToClear.add(AUTH_COOKIE_NAMES.cashier);
      }

      cookiesToClear.forEach((name) => clearAuthCookie(res, name));
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
