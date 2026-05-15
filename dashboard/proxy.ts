import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function verify(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

const PRO_ROUTES = [
  "/owner/analytics",
  "/owner/loyalty",
  "/owner/profit-per-product",
  "/owner/business-health",
  "/owner/peak-hours",
  "/owner/income-statement",
  "/owner/calculator-hpp",
  "/owner/calculator-bep",
  "/owner/sales-target-breakdown",
  "/owner/outlets-manage-tables",
];

const FNB_ONLY_ROUTES = ["/owner/outlets-manage-tables"];

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const selectedOutletType = req.cookies.get("selectedOutletType")?.value;
  const { pathname, searchParams } = req.nextUrl;

  if (!token) return NextResponse.next();

  const payload = await verify(token);

  if (!payload) return NextResponse.next();

  const role = payload.role as "ADMIN" | "OWNER";
  const businessId = payload.businessId;
  const subscriptionPlan = (
    (payload.subscriptionPlan as string) || "BASIC"
  ).toUpperCase();

  /**
   * ROUTE PROTECTION (PRO & OUTLET TYPE)
   */
  if (role === "OWNER") {
    const isProRoute = PRO_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const isFnbOnlyRoute = FNB_ONLY_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const hasProAccess = ["TRIAL", "PRO", "ENTERPRISE"].includes(
      subscriptionPlan
    );

    // 1. Check Outlet Type
    if (isFnbOnlyRoute && selectedOutletType && selectedOutletType !== "FNB") {
      return NextResponse.redirect(new URL("/owner", req.url));
    }

    // 2. Check PRO Access
    if (isProRoute && !hasProAccess) {
      return NextResponse.redirect(new URL("/owner/subscription", req.url));
    }
  }

  /**
   * USER BELUM MEMBUAT BISNIS
   * arahkan ke step=2
   */
  if (role === "OWNER" && !businessId) {
    if (!pathname.startsWith("/auth/register") || !searchParams.get("step")) {
      return NextResponse.redirect(new URL("/auth/register?step=2", req.url));
    }
  }

  /**
   * ROOT REDIRECT
   */
  if (pathname === "/") {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (role === "OWNER") {
      return NextResponse.redirect(new URL("/owner/dashboard", req.url));
    }
  }

  /**
   * USER SUDAH LOGIN TAPI MASUK AUTH PAGE
   */
  if (pathname.startsWith("/auth") && token) {
    if (pathname.startsWith("/auth/register") && searchParams.get("step")) {
      return NextResponse.next();
    }

    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (role === "OWNER") {
      return NextResponse.redirect(new URL("/owner/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth/:path*", "/owner/:path*"],
};