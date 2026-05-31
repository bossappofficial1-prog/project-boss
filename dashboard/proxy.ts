import { jwtVerify, decodeJwt } from "jose";
import { NextRequest, NextResponse } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function verify(token: string) {
  try {
    // 1. Fast decode check for expiration before doing crypto
    const decoded = decodeJwt(token);
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // 2. Full cryptographic verification
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

const PRO_ROUTES_PREFIXES = [
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
  "/owner/accounting",
];

const FNB_ONLY_ROUTES_PREFIXES = ["/owner/outlets-manage-tables"];

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const host = req.headers.get("host") || "";

  if (req.headers.get("x-middleware-prefetch")) {
    return NextResponse.next();
  }

  // cashier.bossapp.id → rewrite path ke /cashier/*
  if (host.startsWith("cashier.") && !pathname.startsWith("/_next")) {
    // Auth pages bypass untuk hindari redirect loop
    if (pathname.startsWith("/auth/")) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/kitchen/")) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/help")) {
      return NextResponse.next();
    }

    const cashierToken = req.cookies.get("cashier_token")?.value;
    if (!cashierToken) {
      return NextResponse.redirect(new URL("/auth/login/cashier", req.url));
    }
    const cashierPayload = await verify(cashierToken);
    if (!cashierPayload) {
      const response = NextResponse.redirect(
        new URL("/auth/login/cashier", req.url),
      );
      response.cookies.delete("cashier_token");
      return response;
    }

    if (pathname.startsWith("/manager/")) {
      return NextResponse.next();
    }

    if (pathname !== "/cashier" && !pathname.startsWith("/cashier/")) {
      const url = new URL(`/cashier${pathname}`, req.url);
      url.search = req.nextUrl.search;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  const ownerToken = req.cookies.get("owner_token")?.value;
  const adminToken = req.cookies.get("admin_token")?.value;
  const legacyToken = req.cookies.get("token")?.value;
  const token = ownerToken || adminToken || legacyToken;
  const cashierToken = req.cookies.get("cashier_token")?.value;

  const isManagerOrCashierRoute =
    pathname.startsWith("/manager") || pathname.startsWith("/cashier");

  /**
   * 1. ROUTE PROTECTION FOR CASHIER & MANAGER
   */
  if (isManagerOrCashierRoute) {
    if (!cashierToken) {
      return NextResponse.redirect(new URL("/auth/login/cashier", req.url));
    }

    const cashierPayload = await verify(cashierToken);
    if (!cashierPayload) {
      const response = NextResponse.redirect(
        new URL("/auth/login/cashier", req.url),
      );
      response.cookies.delete("cashier_token");
      return response;
    }

    const cashierRole = cashierPayload.role as string;

    if (pathname.startsWith("/manager") && cashierRole !== "MANAGER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/cashier") && cashierRole !== "CASHIER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  }

  // If not visiting owner/admin/auth/root, and no owner token, we just proceed
  if (!token) {
    return NextResponse.next();
  }

  // 2. Heavy verification only if token exists and it's not a prefetch
  const payload = await verify(token);

  // If token is invalid or expired, clear it and send to login
  if (!payload) {
    const response = NextResponse.redirect(new URL("/auth/login", req.url));
    response.cookies.delete("owner_token");
    response.cookies.delete("admin_token");
    response.cookies.delete("token");
    return response;
  }

  const selectedOutletType = req.cookies.get("selectedOutletType")?.value;
  const role = payload.role as "ADMIN" | "OWNER";
  const businessId = payload.businessId;
  const subscriptionPlan = (
    (payload.subscriptionPlan as string) || "BASIC"
  ).toUpperCase();

  /**
   * ROUTE PROTECTION (PRO & OUTLET TYPE)
   */
  if (role === "OWNER") {
    const isProRoute = PRO_ROUTES_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    const isFnbOnlyRoute = FNB_ONLY_ROUTES_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    const hasProAccess = ["TRIAL", "PRO", "ENTERPRISE"].includes(
      subscriptionPlan,
    );

    // 1. Check Outlet Type
    if (isFnbOnlyRoute && selectedOutletType && selectedOutletType !== "FNB") {
      return NextResponse.redirect(new URL("/owner#add-outlet", req.url));
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
      return NextResponse.rewrite(new URL("/admin/dashboard", req.url));
    }

    if (role === "OWNER") {
      return NextResponse.rewrite(new URL("/owner/dashboard", req.url));
    }
  }

  /**
   * USER SUDAH LOGIN TAPI MASUK AUTH PAGE
   */
  if (pathname.startsWith("/auth") && token) {
    // Allow cashier login page even if logged in as owner
    if (pathname === "/auth/login/cashier") {
      return NextResponse.next();
    }

    if (pathname.startsWith("/auth/register") && searchParams.get("step")) {
      return NextResponse.next();
    }

    const target = role === "ADMIN" ? "/admin/dashboard" : "/owner/dashboard";
    return NextResponse.redirect(new URL(target, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
