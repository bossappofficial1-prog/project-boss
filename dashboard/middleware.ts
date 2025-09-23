import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddleware } from 'next/server';
import * as jose from 'jose';

interface JwtPayload {
  sessionId: string;
  role: 'ADMIN' | 'OWNER';
  iat?: number;
  exp?: number;
}

const ROUTE_CONFIG = {
  publicRoutes: [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/unauthorized'
  ],
  adminOnlyRoutes: [
    '/admin',
    '/admin/dashboard',
    '/admin/businesses',
    '/admin/users',
    '/admin/analytics',
    '/admin/reports',
    '/admin/settings',
    '/admin/system',
    '/admin/support',
    '/admin/withdrawals'
  ],
  ownerOnlyRoutes: ['/owner', '/owner/dashboard'],
  sharedRoutes: ['/profile', '/notifications']
} as const;

const DEFAULT_REDIRECTS = {
  ADMIN: '/admin/dashboard',
  OWNER: '/owner/dashboard'
} as const;

async function verifyJWT(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload || !payload.sessionId || !payload.role) {
      return null;
    }

    if (payload.role !== 'ADMIN' && payload.role !== 'OWNER') {
      return null;
    }

    const result: JwtPayload = {
      sessionId: String(payload.sessionId),
      role: payload.role,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };

    return result;
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

function hasPermission(userRole: 'ADMIN' | 'OWNER', pathname: string): boolean {
  if (ROUTE_CONFIG.adminOnlyRoutes.some(route => pathname.startsWith(route))) {
    return userRole === 'ADMIN';
  }
  if (ROUTE_CONFIG.ownerOnlyRoutes.some(route => pathname.startsWith(route))) {
    return userRole === 'OWNER';
  }
  if (ROUTE_CONFIG.sharedRoutes.some(route => pathname.startsWith(route))) {
    return true;
  }
  return true;
}

function getRoleBasedRedirect(userRole: 'ADMIN' | 'OWNER'): string {
  return DEFAULT_REDIRECTS[userRole];
}

// --- Middleware ---
export const middleware: NextMiddleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Skip static / api
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const isPublicRoute = ROUTE_CONFIG.publicRoutes.some(
    route => pathname === route || pathname.startsWith(route)
  );

  // Tidak ada token & bukan public → redirect ke login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Ada token → verifikasi
  if (token) {
    const payload = await verifyJWT(token);

    if (!payload || isTokenExpired(payload)) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('reason', 'token_invalid_or_expired');

      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('token');
      return response;
    }

    // Kalau akses public route dengan token valid → redirect dashboard
    if (isPublicRoute && pathname !== '/unauthorized') {
      return NextResponse.redirect(
        new URL(getRoleBasedRedirect(payload.role), request.url)
      );
    }

    // Validasi role
    if (!['ADMIN', 'OWNER'].includes(payload.role)) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('reason', 'invalid_role');

      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('token');
      return response;
    }

    // Cek permission
    if (!hasPermission(payload.role, pathname)) {
      const unauthorizedUrl = new URL('/unauthorized', request.url);
      unauthorizedUrl.searchParams.set('reason', 'insufficient_permissions');
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Root redirect sesuai role
    if (pathname === '/') {
      return NextResponse.redirect(
        new URL(getRoleBasedRedirect(payload.role), request.url)
      );
    }

    // Tambahkan payload ke headers agar bisa dipakai di server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sessionId);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-session-id', payload.sessionId);
    requestHeaders.set('x-token-verified', 'true');

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\..*$).*)',
  ],
};
