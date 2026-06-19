import { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { config } from "../config";

export const AUTH_COOKIE_NAMES = {
  owner: "owner_token",
  admin: "admin_token",
  cashier: "cashier_token",
  legacy: "token",
  trustDevice: "trust_device",
} as const;

export type AuthRoleHint = "OWNER" | "ADMIN" | "CASHIER" | "MANAGER";

export const getAuthRoleHint = (req: Request): AuthRoleHint | undefined => {
  const raw = req.headers["x-auth-role"];
  if (typeof raw !== "string") return undefined;
  const normalized = raw.toUpperCase();
  if (
    normalized === "OWNER" ||
    normalized === "ADMIN" ||
    normalized === "CASHIER" ||
    normalized === "MANAGER"
  ) {
    return normalized as AuthRoleHint;
  }
  return undefined;
};

export const getUserCookieName = (role: UserRole): string => {
  return role === "ADMIN" ? AUTH_COOKIE_NAMES.admin : AUTH_COOKIE_NAMES.owner;
};

const getCookieOptions = (maxAgeMs?: number) => {
  const domain = config.COOKIES_DOMAIN;
  const isLocalhost = !domain || domain === "localhost" || domain.startsWith("localhost:");
  return {
    httpOnly: true,
    secure: !isLocalhost,
    sameSite: (isLocalhost ? "lax" : "none") as "none" | "lax",
    domain: domain || undefined,
    path: "/",
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
};

export const setAuthCookie = (
  res: Response,
  cookieName: string,
  token: string,
  maxAgeMs: number,
) => {
  res.cookie(cookieName, token, getCookieOptions(maxAgeMs));
};

export const clearAuthCookie = (res: Response, cookieName: string) => {
  res.clearCookie(cookieName, getCookieOptions());
};
