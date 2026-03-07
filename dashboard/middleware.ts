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

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname, searchParams } = req.nextUrl;

  if (!token) return NextResponse.next();

  const payload = await verify(token);

  if (!payload) return NextResponse.next();

  const role = payload.role as "ADMIN" | "OWNER";
  const businessId = payload.businessId;

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
  matcher: ["/", "/auth/:path*"],
};