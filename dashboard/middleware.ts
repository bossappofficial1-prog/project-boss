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
  console.log('middleware use for load this page')
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const payload = await verify(token);

    if (payload?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (payload?.role === "OWNER") {
      return NextResponse.redirect(new URL("/owner/dashboard", req.url));
    }
  }

  if (pathname.startsWith("/auth") && token) {
    const payload = await verify(token);

    if (payload?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (payload?.role === "OWNER") {
      return NextResponse.redirect(new URL("/owner/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth/:path*"],
};